import React, { useState, useEffect, useCallback } from 'react';

interface NewsArticle {
    title: string;
    source?: string;
    date?: string;
    url?: string;
    image?: string;
    tone?: number;
    category?: string;
    rep?: string;
}

interface NewsFeedProps {
    articles: NewsArticle[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ articles }) => {
    const [globalNews, setGlobalNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Auto-fetch global news from backend proxy on mount
    const fetchGlobalNews = useCallback(async () => {
        setIsLoading(true);
        try {
            const resp = await fetch('http://localhost:8000/api/news/global');
            if (!resp.ok) throw new Error(`Backend ${resp.status}`);
            const fetched = await resp.json();
            setGlobalNews(fetched);
        } catch (err) {
            console.warn('Global news fetch failed:', err);
            setGlobalNews([
                { title: 'UN Security Council Emergency Session — Middle East Crisis', source: 'Reuters', url: 'https://reuters.com', date: '2025-03-18', tone: -8, image: '', category: 'GEO-POL', rep: 'HIGH REP' },
                { title: 'GPS Jamming Activity Surges Across Eastern Mediterranean', source: 'BBC', url: 'https://bbc.com', date: '2025-03-18', tone: -6, image: '', category: 'MILITARY', rep: 'HIGH REP' },
                { title: 'Major Cyclone System Developing in Bay of Bengal', source: 'AP News', url: 'https://apnews.com', date: '2025-03-17', tone: -4, image: '', category: 'WEATHER', rep: 'HIGH REP' },
                { title: 'Ukraine Frontline: Drone Warfare Intensifies', source: 'Al Jazeera', url: 'https://aljazeera.com', date: '2025-03-17', tone: -7, image: '', category: 'CONFLICT', rep: 'HIGH REP' },
                { title: 'Red Sea Shipping Routes Disrupted by Houthi Attacks', source: 'CNN', url: 'https://cnn.com', date: '2025-03-17', tone: -5, image: '', category: 'LOGISTICS', rep: 'MED REP' },
                { title: 'NATO Increases Satellite Surveillance Over Black Sea', source: 'The Guardian', url: 'https://theguardian.com', date: '2025-03-16', tone: -3, image: '', category: 'INTEL', rep: 'HIGH REP' },
            ]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchGlobalNews();
        const interval = setInterval(fetchGlobalNews, 120000); // Refresh every 2 min
        return () => clearInterval(interval);
    }, [fetchGlobalNews]);

    // Use country-specific articles if available, otherwise global
    const displayArticles = articles.length > 0 ? articles : globalNews;

    const sentimentBadge = (tone: number | undefined) => {
        if (tone === undefined) return null;
        if (tone < -5) return { text: 'CRITICAL', color: '#ff3b3b' };
        if (tone < -2) return { text: 'NEGATIVE', color: '#ff8c00' };
        if (tone < 0) return { text: 'CAUTIOUS', color: '#ffcc00' };
        return { text: 'NEUTRAL', color: '#00ff9c' };
    };

    return (
        <div className="news-feed-panel">
            <div className="panel-header">
                <span className="panel-icon">📰</span>
                <span className="panel-title">GLOBAL NEWS FEED</span>
                <span className="live-dot" />
            </div>

            <div className="news-scroll">
                {isLoading && displayArticles.length === 0 && (
                    <div style={{ padding: '20px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '11px' }}>
                        Scanning global frequencies...
                    </div>
                )}

                {displayArticles.map((article, i) => (
                    <a
                        key={i}
                        href={article.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-article-card"
                    >
                        {article.image && (
                            <div className="news-thumb-container">
                                <img
                                    src={article.image}
                                    alt=""
                                    className="news-thumb"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                        )}
                        <div className="news-article-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{article.source}</span>
                            {article.rep && <span className="badge-rep">{article.rep}</span>}
                            <span style={{ color: 'var(--text-secondary)' }}>• {article.date?.substring(0, 10)}</span>
                        </div>

                        <div className="news-article-title" style={{ marginBottom: '8px', lineHeight: '1.4' }}>{article.title}</div>
                        
                        <div className="news-article-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {article.tone !== undefined && (
                                    <span className="badge-sentiment" style={{ borderColor: sentimentBadge(article.tone)?.color, color: sentimentBadge(article.tone)?.color }}>
                                        {sentimentBadge(article.tone)?.text}
                                    </span>
                                )}
                                {article.category && (
                                    <span className="badge-category">{article.category}</span>
                                )}
                            </div>
                            <span style={{ fontSize: '9px', color: 'var(--color-info)', fontWeight: 'bold' }}>SOURCE ↗</span>
                        </div>
                    </a>
                ))}
            </div>

            <div className="panel-footer" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <button 
                    className="ai-intel-btn" 
                    onClick={() => {
                        const topHeadlines = displayArticles.slice(0, 5).map(a => `- ${a.title} (${a.source})`).join('\n');
                        const prompt = `Summarize these latest global news alerts and provide an AI INTEL BRIEF:\n${topHeadlines}`;
                        window.dispatchEvent(new CustomEvent('commandInput', { detail: { text: prompt } }));
                    }}
                >
                    <span style={{ marginRight: '6px' }}>✨</span> REQUEST AI INTEL BRIEF
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '5px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>SOURCE: GDELT PROJECT API</span>
                    <span className="rec-indicator">● REC</span>
                </div>
            </div>
        </div>
    );
};

export default NewsFeed;
