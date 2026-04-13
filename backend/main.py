from flask import Flask, request, jsonify
from flask_cors import CORS
from difflib import get_close_matches
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

# load the dataset
try:
    foods = pd.read_csv('foods.csv')
    foods = foods.fillna(0)
except FileNotFoundError:
    print("foods.csv not found. Please update the file path.")
    exit()

# assign categories based on GI
def gi_category(gi):
    if pd.isna(gi):
        return "Unknown"
    if gi <= 55:
        return "Low"
    elif gi <= 69:
        return "Medium"
    else:
        return "High"

foods["GI_category"] = foods["GI"].apply(gi_category)

# compute the PCOS-friendly score based on GI, fiber, protein, and carbs
def compute_pcos_score(row):
    score = 0

    #GI
    if row["GI"] <= 55:
        score += 3
    elif row["GI"] <= 69:
        score += 1
    else:
        score -= 2

    # Fiber
    if row["Fiber"] >= 5:
        score += 2
    elif row["Fiber"] >= 2:
        score += 1

    #Protein
    if row["Protein"] >= 15:
        score += 2
    elif row["Protein"] >= 5:
        score += 1

    #placing more penalty on high carbs since they can spike insulin
    if row["Carbs"] >= 30:
        score -= 2
    elif row["Carbs"] >= 15:
        score -= 1

    # Healthy fat bonus (unsaturated fats are better for PCOS than saturated fats)
    if row["Fat"] > 0 and row["Sat.Fat"] < row["Fat"] * 0.4:
        score += 1

    return score

foods["PCOS_score"] = foods.apply(compute_pcos_score, axis=1)

# implement a similarity matrix based on the features
def build_similarity_matrix(df):
    features = df[['GI', 'Protein', 'Fat', 'Sat.Fat', 'Fiber', 'Carbs', 'PCOS_score']].copy()
    features.fillna(features.mean(), inplace=True)

    scaler = StandardScaler()
    scaled = scaler.fit_transform(features)

    return cosine_similarity(scaled)

sim_matrix = build_similarity_matrix(foods)

# implement a warning system for high GI, high carbs, and high saturated fat
def get_food_warning(row):
    warnings = []

    if row["GI"] > 70:
        warnings.append("High GI - may spike blood sugar\n")

    if row["Carbs"] > 30:
        warnings.append("High carbs\n")

    if row["Sat.Fat"] > 10:
        warnings.append("High saturated fat\n")

    if warnings == []:
        return "No major concerns"

    return warnings

# function to explain the PCOS score based on the food's attributes
def explain_score(row):
    explanation = []

    if row["GI"] <= 55:
        explanation.append("Low GI - good for blood sugar\n")

    if row["Fiber"] >= 5:
        explanation.append("High fiber - supports insulin sensitivity\n")

    if row["Protein"] >= 15:
        explanation.append("High protein - stabilizes energy\n")

    if explanation == []:
        return "This food has neutral impact on PCOS based on its attributes."
    return explanation

# food substitution logic: find foods in the same category with a better PCOS score
def suggest_substitutes(food_name):
    user_food = foods[foods["Food"] == food_name].iloc[0]

    candidates = foods[
        (foods["Category"] == user_food["Category"]) &
        (foods["PCOS_score"] > user_food["PCOS_score"])
    ]

    return candidates.sort_values(by="PCOS_score", ascending=False).head(5)

# meal scoring logic: basically a weighted average GI for the meal based on the GI and carb content of each item
def meal_score(meal_items):
    total_score = 0
    total_carbs = 0

    for item in meal_items:
        match = find_best_match(item, foods["Food"].tolist())
        if not match:
            continue

        food = foods[foods["Food"] == match].iloc[0]
        total_score += food["GI"] * food["Carbs"]
        total_carbs += food["Carbs"]

    if total_carbs == 0:
        return 0

    return total_score / total_carbs

# recommendation API
@app.route('/recommend', methods=['POST'])
def recommend_similar():
    data = request.get_json()
    food_name = data.get("food")
    top_n = int(data.get("top", 5))

    food_list = foods['Food'].tolist()
    matched_food = find_best_match(food_name, food_list)

    if not matched_food:
        return jsonify({"error": f"No similar food found for '{food_name}'"}), 404

    category = foods.loc[foods['Food'] == matched_food, 'Category'].values[0]
    category_foods = foods[foods['Category'] == category].reset_index(drop=True)

    sim_matrix = build_similarity_matrix(category_foods)

    idx = category_foods[category_foods['Food'] == matched_food].index[0]

    sim_scores = list(enumerate(sim_matrix[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    top_indices = [i[0] for i in sim_scores[1:top_n+1]]
    results = category_foods.iloc[top_indices]

    response = []
    for _, row in results.iterrows():
        response.append({
            "Food": row["Food"],
            "Category": row["Category"],
            "GI": row["GI"],
            "GI_category": row["GI_category"],
            "PCOS_score": row["PCOS_score"],
            "warnings": get_food_warning(row),
            "explanation": explain_score(row)
        })

    return jsonify(response)

# SUBSTITUTES API
@app.route('/substitute', methods=['POST'])
def substitute():
    data = request.get_json()
    food_name = data.get("food")

    matched = find_best_match(food_name, foods["Food"].tolist())

    if not matched:
        return jsonify({"error": "Food not found"}), 404

    user_food = foods[foods["Food"] == matched].iloc[0]

    candidates = foods[
        (foods["Category"] == user_food["Category"]) &
        (foods["PCOS_score"] > user_food["PCOS_score"])
    ].sort_values(by="PCOS_score", ascending=False).head(5)

    return jsonify(candidates.to_dict(orient="records"))

# GI filter API
@app.route('/gi/<string:level>', methods=['GET'])
def filter_by_gi(level):
    level = level.lower()

    if level == "low":
        filtered = foods[foods["GI"] <= 55]
    elif level == "medium":
        filtered = foods[(foods["GI"] > 55) & (foods["GI"] <= 69)]
    elif level == "high":
        filtered = foods[foods["GI"] >= 70]
    else:
        return jsonify({"error": "Invalid GI level"}), 400

    return jsonify(filtered.to_dict(orient="records"))

# meal API
@app.route('/meal', methods=['POST'])
def analyze_meal():
    data = request.get_json()
    meal_items = data.get("foods", [])

    total_score = 0
    total_carbs = 0

    for item in meal_items:
        match = find_best_match(item, foods["Food"].tolist())
        if not match:
            continue

        food = foods[foods["Food"] == match].iloc[0]
        total_score += float(food["GI"]) * food["Carbs"]
        total_carbs += food["Carbs"]

    meal_gi = total_score / total_carbs if total_carbs != 0 else 0

    return jsonify({
        "meal_gi": meal_gi,
        "message": f'Your meal\'s GI score is {gi_category(meal_gi)} for PCOS'
    })

# simple endpoints to get all unique categories for dropdowns
@app.route('/search', methods=['GET'])
def get_categories():
    unique_categories = foods['Category'].unique()
    return jsonify([{'Category': cat} for cat in unique_categories])

@app.route('/specify/<string:category>', methods=['GET'])
def specify(category):
    print("Requested category:", repr(category))
    print("Available categories:", foods["Category"].unique())

    print("MATCH COUNT:", len(foods[foods["Category"] == category]))

    filtered = foods[foods['Category'] == category]
    filtered = filtered.sort_values(by='PCOS_score', ascending=False)

    print("Filtered foods:", filtered[["Food", "PCOS_score"]].head())
    return jsonify(filtered.to_dict(orient="records"))

# food matching logic: exact match > partial match > close match using difflib
def find_best_match(user_input, food_list):
    user_input = user_input.lower().strip()
    normalized_foods = [f.lower().strip() for f in food_list]

    for food in food_list:
        if user_input == food.lower().strip():
            return food

    for food in food_list:
        if user_input in food.lower():
            return food

    matches = get_close_matches(user_input, normalized_foods, n=1, cutoff=0.3)

    if matches:
        for food in food_list:
            if food.lower().strip() == matches[0]:
                return food

    return None

if __name__ == '__main__':
    app.run(debug=True)