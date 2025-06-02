import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const App = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [viewMode, setViewMode] = useState('posts');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Обернем fetchWithRetry в useCallback
  const fetchWithRetry = useCallback(async (url, options = {}, retries = 3) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
  }, []);

  // Обернем fetchData в useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, postsData] = await Promise.all([
        fetchWithRetry('https://jsonplaceholder.typicode.com/users'),
        fetchWithRetry('https://jsonplaceholder.typicode.com/posts')
      ]);
      
      setUsers(usersData);
      setPosts(postsData);
    } catch (err) {
      setError(`Ошибка загрузки данных: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry]); // Добавляем fetchWithRetry в зависимости

  useEffect(() => {
    fetchData();
  }, [fetchData, retryCount]); // Теперь все зависимости указаны

  // Остальной код остается без изменений
  const getUserById = (userId) => users.find(user => user.id === userId);
  const getPostsByUser = (userId) => posts.filter(post => post.userId === userId);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Произошла ошибка</h2>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Попробовать снова ({3 - retryCount} попыток осталось)
        </button>
        <div className="fallback-data">
          <p>Используются тестовые данные...</p>
          <button onClick={() => {
            setUsers(require('./fallback-users.json'));
            setPosts(require('./fallback-posts.json'));
            setError(null);
          }}>
            Загрузить тестовые данные
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>Посты пользователей</h1>
        <div className="view-toggle">
          <button
            onClick={() => setViewMode('posts')}
            className={viewMode === 'posts' ? 'active' : ''}
          >
            Все посты
          </button>
          <button
            onClick={() => setViewMode('users')}
            className={viewMode === 'users' ? 'active' : ''}
          >
            По пользователям
          </button>
        </div>
      </header>

      {viewMode === 'posts' ? (
        <div className="posts-grid">
          {posts.map(post => {
            const user = getUserById(post.userId);
            return (
              <article key={post.id} className="post-card">
                <header className="post-header">
                  <h3>{user?.name || 'Неизвестный автор'}</h3>
                </header>
                <div className="post-content">
                  <h4>{post.title}</h4>
                  <p>{post.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="users-layout">
          <aside className="users-sidebar">
            <h2>Пользователи</h2>
            <ul>
              {users.map(user => (
                <li
                  key={user.id}
                  className={selectedUserId === user.id ? 'selected' : ''}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  {user.name}
                </li>
              ))}
            </ul>
          </aside>
          
          <main className="user-posts">
            {selectedUserId ? (
              <>
                <h2>Посты пользователя: {getUserById(selectedUserId)?.name}</h2>
                {getPostsByUser(selectedUserId).length > 0 ? (
                  getPostsByUser(selectedUserId).map(post => (
                    <article key={post.id} className="post-card">
                      <h3>{post.title}</h3>
                      <p>{post.body}</p>
                    </article>
                  ))
                ) : (
                  <p>Нет постов</p>
                )}
              </>
            ) : (
              <p>Выберите пользователя</p>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default App;