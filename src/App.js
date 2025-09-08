import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [examples, setExamples] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(" ");
  const [foods, setFoods] = useState([]);

  async function send(event) {
    event.preventDefault();

    var new_text = document.getElementById('food');
    var new_top = document.getElementById('top');

    const food = new_text.value;
    const top = new_top.value;

    console.log(food);
    console.log(top);

    try {
      const response = await fetch('http://127.0.0.1:5000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'food': food, 'top': top }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Recommendations are ready!: ", data);
        setExamples(data);
      } else {
        console.log("Trouble fetching recommendations");
      }
    } catch (error) {
      console.error(error.message);
    }

    new_text.value = "";
    new_top.value = "";
  }

  async function getCategories() {
    try {
      const response = await fetch('http://127.0.0.1:5000/search');
      const data = await response.json();

      if (response.ok) {
        setCategories(data);
      } else {
        console.error("Trouble fetching categories:", data.error);
      }
    } catch (error) {
      console.error("Error connecting to server:", error.message);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  async function filterFoods(category){
    try{
      const response = await fetch(`http://127.0.0.1:5000/specify/${category}`)
      const data = await response.json();

      if(response.ok){
        setFoods(data);
      } else{
        console.log("Unable to retrieve foods", data.error)
      }
    } catch(error){
      console.error("Problem fetching foods", error.message)
    }
  };

  useEffect(() => {
    filterFoods(selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="App">
      <header>
        <h1>PCOS Food Recommender</h1>
      </header>

      <form>
        <input type='text' id='food' placeholder='Enter food item...' />
        <input type='text' id='top' placeholder='How many items?' />
        <button onClick={send}>Submit</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Food</th>
            <th>Category</th>
            <th>Score</th>
          </tr>
        </thead>
      
        {examples.map((ex) => (
          <tbody>
            <tr>
              <td key={ex.Food}>{ex.Food}</td>
              <td key={ex.Category}>{ex.Category}</td>
              <td key={ex.PCOS_score}>{ex.PCOS_score}</td>
            </tr>
          </tbody>
        ))}
      </table>

      <label htmlFor='categories'>Categories: </label>
      <select id='categories'  onChange={(e)=> setSelectedCategory(e.target.value)} value={selectedCategory}>
        <option value="">Select a category...</option>
        {categories.map((cat) =>(
          <option key={cat.Category}>{cat.Category}</option>
        ))}
      </select>

      <table>
        <tr>
          <th>Food</th>
          <th>Category</th>
          <th>Score</th>
        </tr>

        {foods.map((ex) => (
          <tr>
            <td key={ex.Food}>{ex.Food}</td>
            <td key={ex.Category}>{ex.Category}</td>
            <td key={ex.PCOS_score}>{ex.PCOS_score}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}

export default App;
