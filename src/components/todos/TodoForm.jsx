import { useState } from 'react';

const TodoForm = ({ onTodoAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      await onTodoAdded({
        title: title.trim(),
        description: description.trim()
      });
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-control"
          placeholder="Enter todo title"
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-control"
          placeholder="Enter todo description"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className={`btn btn-primary w-100 ${(loading || !title.trim()) ? 'opacity-50' : ''}`}
      >
        {loading ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
};

export default TodoForm;