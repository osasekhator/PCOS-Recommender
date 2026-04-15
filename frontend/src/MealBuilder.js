import { useRef, useState } from "react";

/** Draggable meal builder */
export default function MealBuilder({ mealItems, setMealItems, onAnalyze, mealLoading }) {
  const [search, setSearch] = useState('');
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  function addItem() {
    const trimmed = search.trim();
    if (!trimmed) return;
    setMealItems(prev => [...prev, trimmed]);
    setSearch('');
  }

  function removeItem(idx) {
    setMealItems(prev => prev.filter((_, i) => i !== idx));
  }

  function handleDragStart(idx) { dragItem.current = idx; }
  function handleDragEnter(idx) { dragOver.current = idx; }

  function handleDrop() {
    const copy = [...mealItems];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    setMealItems(copy);
  }

  return (
    <div className="meal-builder">
      <div className="meal-add-row">
        <input
          type="text"
          placeholder="Add ingredient…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button type="button" onClick={addItem}>Add</button>
      </div>

      {mealItems.length > 0 && (
        <ul className="meal-chip-list">
          {mealItems.map((item, i) => (
            <li
              key={i}
              className="meal-chip"
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <span className="drag-handle">⠿</span>
              {item}
              <button className="chip-remove" onClick={() => removeItem(i)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      {mealItems.length > 0 && (
        <button className="analyze-btn" onClick={onAnalyze} disabled={mealLoading}>
          {mealLoading ? 'Analyzing…' : `Analyze ${mealItems.length} ingredient${mealItems.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}