# 🥗 PCOS-Friendly Food Recommender (Algorithm-Powered)
A specialized web application built to support individuals managing Polycystic Ovary Syndrome (PCOS). This tool leverages a Client-Side Algorithm derived from nutritional science principles and comprehensive data to provide personalized, PCOS-friendly food recommendations and suggests suitable alternatives.

## ✨ Key Features
🧠 Client-Side Scoring Algorithm: Utilizes custom JavaScript logic to score and filter foods based on nutrient density relevant to PCOS management (e.g., low glycemic index, anti-inflammatory properties). No backend server required for predictions.

🔎 Food Lookup & Analysis: Allows users to search for any food item and instantly view its nutritional breakdown and PCOS compatibility score.

🔄 Alternative Suggestions: Recommends nutrient-similar food alternatives that meet the PCOS-friendly criteria.

📊 Data-Driven Insights: All recommendations are grounded in specific nutritional data derived from the integrated dataset.

📱 Fully Responsive Interface: Built with React for a seamless experience on desktop and mobile devices.

🛠️ Technology Stack
This project is entirely client-side, making it highly efficient and easy to deploy.

1. Frontend (UI & Logic)
Framework: React

Data Logic: Custom JavaScript Scoring Logic and Filtering Algorithms

Function: Handles the user interface, executes the recommendation algorithm, and displays results.

2. Data Source
Data Source: Kaggle Food Nutrition Facts Dataset (Pre-processed and bundled as static data).

Algorithm: The scoring logic is embedded directly in the React code for instant, client-side execution.

3. Deployment Advantage
Deployed Backend using free version of Render, which unfortunately results in a lot of downtime, and Frontend using Vercel. Click the link to try it out: https://pcos-recommender-qgbk.vercel.app/

💾 Data Source
The core intelligence of this application is derived from the Food Nutrition Facts Dataset found on Kaggle:

Nutrition Details for Most Common Foods
- link: https://www.kaggle.com/datasets/niharika41298/nutrition-details-for-most-common-foods?select=nutrients_csvfile.csv

Preprocessing: The raw data was cleaned and integrated into a format suitable for quick client-side lookup. To attain my goal, I had to add a column, "GI", to the actual dataset. I achieved these values with the help of generative AI, namely, ChatGPT. Scoring logic and filters were developed based on the nutritional markers critical for PCOS management.

🤖 AI Usage:
I used `ChatGPT` to generate the values I have for the column, "GI". Additionally, I used VSCode's `IntelliSense` to generate informative comments for complex implementations and it also helped me with stlying for smaller screens. Another thing I used ChatGPT for, was deciding what weights and penalties to assign to certain nutrients.
