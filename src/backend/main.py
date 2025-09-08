from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

# You will need to change these file paths to match your system.
# The `r''` prefix creates a raw string, which handles backslashes correctly.
# Try to use a relative path if possible, or ensure the file is in the same directory as the script.
# For example: foods = pd.read_csv('foods.csv')
try:
    foods = pd.read_csv(r'C:\\Users\\Osas\\Personal_projects\\PCOS_project\\foods.csv')
except FileNotFoundError:
    print("foods.csv not found. Please update the file path.")
    exit()

try:
    nutrition = pd.read_excel(r'C:\\Users\\Osas\\Personal_projects\\PCOS_project\\nutritionalsamples.xlsx')
except FileNotFoundError:
    print("nutritionalsamples.xlsx not found. Please update the file path.")
    # Exit or continue with a dummy DataFrame if the file is not essential for the rest of the script.
    # In this case, we can continue as the main logic is based on `foods`.
    nutrition = pd.DataFrame() # Create an empty DataFrame to prevent errors.

# 1. Calculate 'net carbs' on the nutrition DataFrame
if not nutrition.empty and 'carbs(g)' in nutrition.columns and 'fiber(g)' in nutrition.columns:
    nutrition['net carbs'] = nutrition['carbs(g)'] - nutrition['fiber(g)']
    print("Nutrition DataFrame head after adding 'net carbs' column:")
    print(nutrition.head())

# 2. Define the `pcos_score` function
def pcos_score(row):
    protein_weight = 2
    fat_weight = -3
    fiber_weight = 2
    # Based on the screenshot, the 'Carbs' column is not used in the score calculation, but 'Fat' and 'Sat.Fat' are.
    # The function definition uses 'Protein', 'Sat.Fat', 'Fiber' from the 'foods' DataFrame.
    # This seems to be the most consistent interpretation of the screenshots.
    # Note: There is an inconsistency in the screenshot where one function uses `sugar` and `carb_weight`, but we will stick to the one that aligns with the final `foods` DataFrame.
    calc_score = (protein_weight * row['Protein']) + (fat_weight * row['Sat.Fat']) + (fiber_weight * row['Fiber'])
    return calc_score

# 3. Apply the `pcos_score` to the `foods` DataFrame
foods['PCOS_score'] = foods.apply(pcos_score, axis=1)
print("\nFoods DataFrame head after adding 'PCOS_score' column:")
print(foods.head())

# 4. Data preprocessing for cosine similarity
# Select features as shown in the screenshot
features = foods[['Protein', 'Fat', 'Sat.Fat', 'Fiber', 'Carbs', 'PCOS_score']].copy()
# Handle missing values by filling with the mean
features.fillna(features.mean(), inplace=True)

# Scale the features
scaler = StandardScaler()
features_scaled = scaler.fit_transform(features)

# Calculate the cosine similarity matrix
sim_matrix = cosine_similarity(features_scaled)

# # 5. Define `recommend_similar` function
# def recommend_similar(food_name, top_n=5):
#     if food_name not in foods['Food'].values:
#         print(f"Food '{food_name}' not found in dataset. Try one of: {list(foods['Food'].sample(5))}")
#         return None
#     idx = foods[foods['Food'] == food_name].index[0]
#     sim_scores = list(enumerate(sim_matrix[idx]))
#     sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
#     top_indices = [i[0] for i in sim_scores[1:top_n+1]]
#     return foods.iloc[top_indices][['Food', 'Category', 'PCOS_score']]

# # 6. Define `recommend` function
# def recommend(df, top=10, category=None):
#     filtered = df.copy()
#     if category:
#         filtered = filtered[filtered['Category'] == category]
#     recommendation = filtered.sort_values(by='PCOS_score', ascending=False)
#     return recommendation.head(top)

# # 7. Example usage
# print("\n--- Example: Top 10 recommendations for 'Fruits A-F' ---")
# recommendations_fruits = recommend(foods, 10, 'Fruits A-F')
# print(recommendations_fruits)

# print("\n--- Example: Foods similar to 'Shrimp' ---")
# similar_foods_shrimp = recommend_similar("Shrimp", top_n=5)
# if similar_foods_shrimp is not None:
#     print(similar_foods_shrimp)


@app.route('/recommend', methods=['POST'])
def recommend_similar():
    data = request.get_json()
    food_name = data.get("food")
    try:
        top_n = int(data.get("top", 5))  # default to 5 if missing
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid 'top' value, must be an integer"}), 400

    if food_name not in foods['Food'].values:
        # print(f"Food '{food_name}' not found in dataset. Try one of: {list(foods['Food'].sample(5))}")
        return jsonify({"error": f"Food '{food_name}' not found"}), 404
    idx = foods[foods['Food'] == food_name].index[0]
    sim_scores = list(enumerate(sim_matrix[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    top_indices = [i[0] for i in sim_scores[1:top_n+1]]
    results = foods.iloc[top_indices][['Food', 'Category', 'PCOS_score']]
    return jsonify(results.to_dict(orient="records"))

@app.route('/search', methods=['GET'])
def get_categories():
    try:
        # Get unique categories and format them as a list of dictionaries
        unique_categories = foods['Category'].unique()
        category_list = [{'Category': cat} for cat in unique_categories]
        return jsonify(category_list)
    except KeyError:
        return jsonify({"error": "The 'Category' column was not found in the dataset."}), 500
    
@app.route('/specify/<string:category>', methods=['GET'])
def specify(category):
    try:
        filtered = foods[foods['Category'] == category]
        filtered = filtered.sort_values(by='PCOS_score', ascending=False)
        results = filtered.to_dict(orient="records")
        return jsonify(results)
    except KeyError:
        return jsonify({"error": "The 'Category' column was not found in the dataset or an invalid category was provided."}), 500


if __name__ == '__main__':
    app.run()