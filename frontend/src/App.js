import { useState, useEffect } from 'react';
import './App.css';
//import logo from '/pcos_logo.png';

function App() {
  const [activeTab, setActiveTab] = useState("about");

  //shared states
  const [categories, setCategories] = useState([]);
  const URL = "https://pcos-food-app.onrender.com";

  // recommend states
  const [examples, setExamples] = useState([]);
  const [foodInput, setFoodInput] = useState("");
  const [topInput, setTopInput] = useState("");
  const [loading, setLoading] = useState(false);

  // browsing states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [foods, setFoods] = useState([]);

  // substitute states
  const [subInput, setSubInput] = useState("");
  const [subResults, setSubResults] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  //GI filter states
  const [giLevel, setGiLevel] = useState("");
  const [giFoods, setGiFoods] = useState([]);

  // meal planning states
  const [mealInput, setMealInput] = useState("");
  const [mealItems, setMealItems] = useState([]);
  const [mealResult, setMealResult] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);

  // recommendation function
  async function send(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: foodInput,
          top: topInput || 5 // defaulting to top 5 if topInput is empt
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setExamples(Array.isArray(data) ? data : []);
      } else {
        console.log(data.error);
      }
    } catch (error) {
      console.error(error.message);
    }

    setFoodInput("");
    setTopInput("");
    setLoading(false);
  }

  //the category browsing functions
  async function getCategories() {
    try {
      const response = await fetch(`${URL}/search`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function filterFoods(category) {
    if (!category) return;

    try {
      const response = await fetch(
        `${URL}/specify/${category}`
      );

      const data = await response.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error.message);
    }
  }

  // substitute function
  async function getSubstitutes(event) {
    event.preventDefault();
    setSubLoading(true);

    try {
      const response = await fetch(`${URL}/substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: subInput
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubResults(Array.isArray(data) ? data : []);
      } else {
        console.log(data.error);
      }
    } catch (error) {
      console.error(error.message);
    }

    setSubInput("");
    setSubLoading(false);
  }

  // GI filter function
  async function filterGI(level) {
    if (!level) return;

    try {
      const response = await fetch(
        `${URL}/gi/${level.toLowerCase()}`
      );

      const data = await response.json();

      if (response.ok) {
        setGiFoods(Array.isArray(data) ? data : []);
      } else {
        console.log(data.error);
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  // meal planning function
  async function analyzeMeal(event) {
    event.preventDefault();
    setMealLoading(true);

    try {
      const foodsArray = mealInput
        .split(",") // split by commas
        .map(item => item.trim())
        .filter(Boolean);

        setMealItems(foodsArray);

      const response = await fetch(`${URL}/meal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foods: foodsArray
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMealResult(data);
      } else {
        console.log(data.error);
      }
    } catch (error) {
      console.error(error.message);
    }

    setMealLoading(false);
  }

  //useEffects for initial category load and filtering foods when category changes
  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      filterFoods(selectedCategory);
    } else {
      setFoods([]);
    }
  }, [selectedCategory]);

  return (
    <div className="App">
      <header>
        <img src="/pcos_logo.jpg" alt="PCOS Food App Logo" className="logo" />
        <h1>PCOS Food App</h1>
      </header>
      <hr/>
      
      <p>Smart food insights for PCOS management 🍎</p>

      {/* initialize tab selection buttons */}
      <div className="tabs">
        <button className={activeTab === "about" ? "active" : ""} onClick={() => setActiveTab("about")}>
          About
        </button>
        <button onClick={() => setActiveTab("recommend")}>Recommend</button>
        <button onClick={() => setActiveTab("browse")}>Browse</button>
        <button onClick={() => setActiveTab("substitute")}>Substitute</button>
        <button onClick={() => setActiveTab("gi")}>GI Filter</button>
        <button onClick={() => setActiveTab("meal")}>Meal Analyzer</button>
      </div>

      <hr/>

      {/*About Tab */}
      {activeTab === "about" && (
        <section className="card">
          <h2>About The PCOS Food App ♀️</h2>

          <p>
            This application is intended to help women explore food options and make more informed
            dietary choices that may support PCOS-friendly eating habits.
          </p>

          <h3>How it works</h3>
          <ul>
            <li>Recommends similar foods based on nutrition similarity</li>
            <li>Allows browsing by food category</li>
            <li>Suggests healthier substitutes</li>
            <li>Analyzes meals based on nutritional composition</li>
          </ul>

          <h3>Disclaimer ⚠️</h3>
          <p style={{ color: "darkred", fontWeight: "bold" }}>
            This application is for educational and informational purposes only.
            It is not intended to provide medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare professional or registered dietitian
            before making dietary or health decisions related to PCOS or any medical condition.
          </p>
        </section>
      )}

      {/* Recommendation Tab */}
      {activeTab === "recommend" && (
        <section className="card">
          <h2>Recommend Similar Foods</h2>

          <form onSubmit={send}>
            <input
              type="text"
              placeholder="Enter food..."
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
            />

            <input
              type="number"
              placeholder="Top N"
              value={topInput}
              onChange={(e) => setTopInput(e.target.value)}
            />

            <button type="submit">
              {loading ? "Loading..." : "Submit"}
            </button>
          </form>

          <div className='table-wrapper'>
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                <th>Category</th>
                <th>GI Category</th>
                <th>PCOS Score</th>
                <th>Warnings</th>
                <th>Explanation</th>
                </tr>
              </thead>

              <tbody>
                {examples.map((item) => (
                  <tr key={item.Food}>
                    <td>{item.Food}</td>
                    <td>{item.Category}</td>
                    <td>{item.GI_category}</td>
                    <td>{item.PCOS_score}</td>
                    <td>{item.warnings}</td>
                    <td>{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Browse Tab */}
      {activeTab === "browse" && (
        <section className="card">
          <h2>Browse by Category</h2>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.Category} value={cat.Category}>
                {cat.Category}
              </option>
            ))}
          </select>

          <div className='table-wrapper'>

            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Category</th>
                  <th>PCOS Score</th>
                </tr>
              </thead>

              <tbody>
                {foods.map((item) => (
                  <tr key={item.Food}>
                    <td>{item.Food}</td>
                    <td>{item.Category}</td>
                    <td>{item.PCOS_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Substitute Tab */}
      {activeTab === "substitute" && (
        <section className="card">
          <h2>Smart Substitutions 🔄</h2>

          <form onSubmit={getSubstitutes}>
            <input
              type="text"
              placeholder="Enter food to replace..."
              value={subInput}
              onChange={(e) => setSubInput(e.target.value)}
            />

            <button type="submit">
              {subLoading ? "Finding..." : "Find substitutes"}
            </button>
          </form>

          <div className='table-wrapper'>
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Category</th>
                  <th>PCOS Score</th>
                </tr>
              </thead>

              <tbody>
                {subResults.map((item) => (
                  <tr key={item.Food}>
                    <td>{item.Food}</td>
                    <td>{item.Category}</td>
                    <td>{item.PCOS_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* GI Filter Tab */}
      {activeTab === "gi" && (
        <section className="card">
          <h2>GI Filter 🔍</h2>

          <select
            value={giLevel}
            onChange={(e) => {
              const value = e.target.value;
              setGiLevel(value);
              filterGI(value);
            }}
          >
            <option value="">Select GI Level</option>
            <option value="Low">Low GI 🟢</option>
            <option value="Medium">Medium GI 🟡</option>
            <option value="High">High GI 🔴</option>
          </select>

          <div className='table-wrapper'>
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>GI</th>
                  <th>GI Category</th>
                  <th>PCOS Score</th>
                </tr>
              </thead>

              <tbody>
                {giFoods.map((item) => (
                  <tr key={item.Food}>
                    <td>{item.Food}</td>
                    <td>{item.GI}</td>
                    <td>{item.GI_category}</td>
                    <td>{item.PCOS_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Meal Analyzer Tab   */}
      {activeTab === "meal" && (
        <section className="card">
          <h2>Meal Analyzer 🍽️</h2>

          <p>Please enter your ingredients separated by commas:</p>

          <form onSubmit={analyzeMeal}>
            <input
              type="text"
              placeholder="e.g. rice, chicken, broccoli"
              value={mealInput}
              onChange={(e) => setMealInput(e.target.value)}
            />

            <button type="submit">
              {mealLoading ? "Analyzing..." : "Analyze Meal"}
            </button>
          </form>

          {mealResult && (
            <div className="results" style={{ marginTop: "20px" }}>
              <h3>Result:</h3>
              <p><b>Ingredients:</b></p>
              {mealItems.map(item => <p>{item}</p>)}

              <p><b>Meal GI Score:</b> {mealResult.meal_gi}</p>
              <p>{mealResult.message}</p>
            </div>
          )}
        </section>
      )}

      <footer>
        <p>&copy; 2026 PCOS Food App developed by Osas Ekhator. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;