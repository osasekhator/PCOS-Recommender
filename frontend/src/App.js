import { useState, useEffect, useRef } from 'react';
import './App.css';
import FoodRow from './FoodRow';

function App() {
  const [activeTab, setActiveTab] = useState('about');
  const [categories, setCategories] = useState([]);
  const URL = 'https://pcos-food-app.onrender.com';

  // recommendation states
  const [examples, setExamples] = useState([]);
  const [foodInput, setFoodInput] = useState('');
  const [topInput, setTopInput] = useState('');
  const [loading, setLoading] = useState(false);

  // browse states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [foods, setFoods] = useState([]);

  // substitute states
  const [subInput, setSubInput] = useState('');
  const [subResults, setSubResults] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // GI filter states
  const [giLevel, setGiLevel] = useState('');
  const [giFoods, setGiFoods] = useState([]);

  // meal states
  const [mealItems, setMealItems] = useState([]);
  const [mealResult, setMealResult] = useState(null);
  const [mealBreakdown, setMealBreakdown] = useState([]);
  const [mealSwaps, setMealSwaps] = useState([]);
  const [mealLoading, setMealLoading] = useState(false);

  // modal
  const [selectedFood, setSelectedFood] = useState(null);

  // favourites & avoids — persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pcos_favorites')) || []; }
    catch { return []; }
  });
  const [avoids, setAvoids] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pcos_avoids')) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('pcos_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('pcos_avoids', JSON.stringify(avoids));
  }, [avoids]);

  function toggleFavorite(name) {
    setFavorites(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
    // remove from avoid if adding to fav
    setAvoids(prev => prev.filter(f => f !== name));
  }

  function toggleAvoid(name) {
    setAvoids(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
    setFavorites(prev => prev.filter(f => f !== name));
  }

  // ── API calls ──────────────────────────────────────────────────────────────

  async function send(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: foodInput, top: topInput || 5 }),
      });
      const data = await res.json();
      setExamples(res.ok && Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setFoodInput('');
    setTopInput('');
    setLoading(false);
  }

  async function getCategories() {
    try {
      const res = await fetch(`${URL}/search`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function filterFoods(category) {
    if (!category) return;
    try {
      const res = await fetch(`${URL}/specify/${category}`);
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function getSubstitutes(event) {
    event.preventDefault();
    setSubLoading(true);
    try {
      const res = await fetch(`${URL}/substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: subInput }),
      });
      const data = await res.json();
      setSubResults(res.ok && Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setSubInput('');
    setSubLoading(false);
  }

  async function filterGI(level) {
    if (!level) return;
    try {
      const res = await fetch(`${URL}/gi/${level.toLowerCase()}`);
      const data = await res.json();
      setGiFoods(res.ok && Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }

  async function analyzeMeal() {
    if (mealItems.length === 0) return;
    setMealLoading(true);
    setMealResult(null);
    setMealBreakdown([]);
    setMealSwaps([]);

    try {
      // overall meal GI
      const res = await fetch(`${URL}/meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods: mealItems }),
      });
      const data = await res.json();
      if (res.ok) setMealResult(data);

      // per-ingredient breakdown: fetch recommend for each item to get nutrition
      const breakdown = await Promise.all(
        mealItems.map(async item => {
          try {
            const r = await fetch(`${URL}/recommend`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ food: item, top: 1 }),
            });
            const d = await r.json();
            // recommend returns similar foods, not the food itself — fetch substitute
            // to get the food row. We use the gi endpoint as a fallback lookup.
            // For now, use the first result as a proxy if available.
            return { name: item, data: Array.isArray(d) && d.length ? d[0] : null };
          } catch { return { name: item, data: null }; }
        })
      );
      setMealBreakdown(breakdown);

      // swap suggestions: for any high-GI ingredient, get substitutes
      const swapPromises = breakdown
        .filter(b => b.data && b.data.GI > 69)
        .map(async b => {
          try {
            const r = await fetch(`${URL}/substitute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ food: b.name }),
            });
            const d = await r.json();
            return { original: b.name, swaps: Array.isArray(d) ? d.slice(0, 2) : [] };
          } catch { return { original: b.name, swaps: [] }; }
        });

      const swapResults = await Promise.all(swapPromises);
      setMealSwaps(swapResults.filter(s => s.swaps.length > 0));
    } catch (e) { console.error(e); }

    setMealLoading(false);
  }

  useEffect(() => { getCategories(); }, []);

  useEffect(() => {
    if (selectedCategory) filterFoods(selectedCategory);
    else setFoods([]);
  }, [selectedCategory]);

  // ── row renderer with favourites/avoid badges ──────────────────────────────

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="App">
      <header>
        <img src="/pcos_logo.jpg" alt="PCOS Food App Logo" className="logo" />
        <h1>PCOS Food App</h1>
      </header>
      <hr />

      <p>Smart food insights for PCOS management 🍎</p>

      <div className="tabs">
        {['about','recommend','browse','substitute','gi','meal','saved'].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
          >
            {tab === 'gi' ? 'GI Filter' : tab === 'saved' ? `Saved (${favorites.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <hr />

      {/* ── About ── */}
      {activeTab === 'about' && (
        <section>
          <h2>About The PCOS Food App ♀️</h2>
          <p>This application is intended to help women explore food options and make more informed dietary choices that may support PCOS-friendly eating habits.</p>
          <h3>How it works</h3>
          <ul>
            <li>Recommends similar foods based on nutrition similarity</li>
            <li>Allows browsing by food category</li>
            <li>Suggests healthier substitutes</li>
            <li>Analyzes meals based on nutritional composition</li>
            <li>Save favourites or flag foods to avoid</li>
          </ul>
          <div className="info-section">
            <h4>Glycemic Index (GI)</h4>
            <p>The Glycemic Index (GI) measures how quickly a food raises blood sugar levels. Lower GI foods cause a slower rise and are generally better for managing insulin levels, which is especially important for individuals with PCOS.</p>
            <ul>
              <li><b>Low GI:</b> 55 or less (preferred) 🟢</li>
              <li><b>Medium GI:</b> 56–69 🟡</li>
              <li><b>High GI:</b> 70+ 🔴</li>
            </ul>
            <h4>PCOS Score</h4>
            <p>A custom metric evaluating how suitable a food may be for individuals with PCOS, based on GI, fibre, protein, carbs, and fat composition. Higher scores = more PCOS-friendly.</p>
          </div>
          <h3>Disclaimer ⚠️</h3>
          <p style={{ color: 'darkred', fontWeight: 'bold' }}>
            This application is for educational and informational purposes only. It is not intended to provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional or registered dietitian before making dietary or health decisions related to PCOS or any medical condition.
          </p>
        </section>
      )}

      {/* ── Recommend ── */}
      {activeTab === 'recommend' && (
        <section>
          <h2>Recommend Similar Foods</h2>
          <form onSubmit={send}>
            <input type="text" placeholder="Enter food…" value={foodInput} onChange={e => setFoodInput(e.target.value)} />
            <input type="number" placeholder="Top N" value={topInput} onChange={e => setTopInput(e.target.value)} />
            <button type="submit">{loading ? 'Loading…' : 'Submit'}</button>
          </form>
          <p className="click-hint">Click any row to see the full nutrition breakdown.</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Food</th><th>Category</th><th>GI</th><th>GI Category</th>
                  <th>PCOS Score</th><th>Warnings</th><th>Why PCOS-friendly?</th>
                </tr>
              </thead>
              <tbody>
                {examples.map(item => (
                  <FoodRow key={item.Food} item={item} cols={['category','gi','gi_category','pcos','warnings','explanation']} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Browse ── */}
      {activeTab === 'browse' && (
        <section>
          <h2>Browse by Category</h2>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.Category} value={cat.Category}>{cat.Category}</option>
            ))}
          </select>
          <p className="click-hint">Click any row to see the full nutrition breakdown.</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Food</th><th>Category</th><th>GI</th><th>PCOS Score</th></tr>
              </thead>
              <tbody>
                {foods.map(item => (
                  <FoodRow key={item.Food} item={item} cols={['category','gi','pcos']} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Substitute ── */}
      {activeTab === 'substitute' && (
        <section>
          <h2>Smart Substitutions 🔄</h2>
          <form onSubmit={getSubstitutes}>
            <input type="text" placeholder="Enter food to replace…" value={subInput} onChange={e => setSubInput(e.target.value)} />
            <button type="submit">{subLoading ? 'Finding…' : 'Find substitutes'}</button>
          </form>
          <p className="click-hint">Click any row to see the full nutrition breakdown.</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Food</th><th>Category</th><th>GI</th><th>PCOS Score</th></tr>
              </thead>
              <tbody>
                {subResults.map(item => (
                  <FoodRow key={item.Food} item={item} cols={['category','gi','pcos']} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── GI Filter ── */}
      {activeTab === 'gi' && (
        <section>
          <h2>GI Filter 🔍</h2>
          <select value={giLevel} onChange={e => { setGiLevel(e.target.value); filterGI(e.target.value); }}>
            <option value="">Select GI Level</option>
            <option value="Low">Low GI 🟢</option>
            <option value="Medium">Medium GI 🟡</option>
            <option value="High">High GI 🔴</option>
          </select>
          <p className="click-hint">Click any row to see the full nutrition breakdown.</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Food</th><th>GI</th><th>GI Category</th><th>PCOS Score</th></tr>
              </thead>
              <tbody>
                {giFoods.map(item => (
                  <FoodRow key={item.Food} item={item} cols={['gi','gi_category','pcos']} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Meal Analyzer ── */}
      {activeTab === 'meal' && (
        <section>
          <h2>Meal Analyzer 🍽️</h2>
          <p>Drag to reorder ingredients. Click <strong>Add</strong> or press Enter to add each one.</p>

          <MealBuilder
            mealItems={mealItems}
            setMealItems={setMealItems}
            onAnalyze={analyzeMeal}
            mealLoading={mealLoading}
          />

          {mealResult && (
            <div className="meal-results">
              <div className="meal-summary">
                <h3>Meal Summary</h3>
                <p><b>Weighted GI Score:</b> {Number(mealResult.meal_gi).toFixed(1)}</p>
                <GIBar gi={Math.round(mealResult.meal_gi)} />
                <p>{mealResult.message}</p>
              </div>

              {mealBreakdown.length > 0 && (
                <div className="meal-breakdown">
                  <h3>Per-ingredient Breakdown</h3>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Ingredient</th><th>GI</th><th>GI Category</th>
                          <th>PCOS Score</th><th>Protein (g)</th><th>Carbs (g)</th><th>Fibre (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mealBreakdown.map(({ name, data }) => (
                          <tr key={name} onClick={() => data && setSelectedFood(data)} style={{ cursor: data ? 'pointer' : 'default' }}>
                            <td>{name}</td>
                            {data ? (
                              <>
                                <td><GIBar gi={data.GI} /></td>
                                <td><span className={`gi-badge ${giColor(data.GI)}`}>{giLabel(data.GI)}</span></td>
                                <td><span className="pcos-score-badge" style={{ background: pcosColor(data.PCOS_score) }}>{data.PCOS_score}</span></td>
                                <td>{data.Protein ?? '–'}</td>
                                <td>{data.Carbs ?? '–'}</td>
                                <td>{data.Fiber ?? '–'}</td>
                              </>
                            ) : (
                              <td colSpan={6} style={{ color: '#aaa' }}>Not found in database</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {mealSwaps.length > 0 && (
                <div className="meal-swaps">
                  <h3>💡 Suggested Swaps</h3>
                  <p className="swap-intro">These high-GI ingredients have PCOS-friendlier alternatives:</p>
                  {mealSwaps.map(({ original, swaps }) => (
                    <div key={original} className="swap-card">
                      <span className="swap-original">Replace <strong>{original}</strong> with:</span>
                      <div className="swap-options">
                        {swaps.map(s => (
                          <div key={s.Food} className="swap-option" onClick={() => setSelectedFood(s)}>
                            <span className="swap-name">{s.Food}</span>
                            <span className="pcos-score-badge" style={{ background: pcosColor(s.PCOS_score), fontSize: '0.75rem' }}>
                              Score {s.PCOS_score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Saved ── */}
      {activeTab === 'saved' && (
        <section>
          <h2>Your Saved Foods</h2>

          <div className="saved-columns">
            <div className="saved-col">
              <h3>⭐ Favourites ({favorites.length})</h3>
              {favorites.length === 0
                ? <p className="empty-msg">No favourites yet. Click a food row and save it.</p>
                : (
                  <ul className="saved-list">
                    {favorites.map(name => (
                      <li key={name} className="saved-item">
                        <span>{name}</span>
                        <button className="remove-saved" onClick={() => toggleFavorite(name)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            <div className="saved-col">
              <h3>⛔ Avoiding ({avoids.length})</h3>
              {avoids.length === 0
                ? <p className="empty-msg">Nothing flagged to avoid yet.</p>
                : (
                  <ul className="saved-list">
                    {avoids.map(name => (
                      <li key={name} className="saved-item avoid-item">
                        <span>{name}</span>
                        <button className="remove-saved" onClick={() => toggleAvoid(name)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
        </section>
      )}

      {/* ── Nutrition Modal ── */}
      <NutritionModal
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        favorites={favorites}
        avoids={avoids}
        toggleFavorite={toggleFavorite}
        toggleAvoid={toggleAvoid}
      />

      <footer>
        <p>&copy; 2026 PCOS Food App developed by Osas Ekhator. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;