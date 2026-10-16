import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink, Globe, Sparkles, FileText, CheckCircle } from 'lucide-react';

interface PubMedArticle {
  uid: string;
  title: string;
  source: string;
  pubdate: string;
  authors: string;
  doi?: string;
  url: string;
}

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export const LiteratureExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'pubmed'>('search');
  const [searchQuery, setSearchQuery] = useState('NASA astronaut hypercapnia headache threshold ambient CO2');
  const [groundedResult, setGroundedResult] = useState<string>('');
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [pubmedArticles, setPubmedArticles] = useState<PubMedArticle[]>([]);
  const [pubmedQuery, setPubmedQuery] = useState('microgravity cardiovascular deconditioning SANS');
  const [isPubmedLoading, setIsPubmedLoading] = useState(false);

  // Trigger Gemini-3.8-Flash Search Grounding
  const handleSearchGrounding = async (queryToRun?: string) => {
    const q = queryToRun || searchQuery;
    setIsSearching(true);
    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setGroundedResult(data.text || 'No grounded text returned.');
      setGroundingSources(data.groundingChunks || []);
    } catch (err: any) {
      console.error('Failed to search grounded data:', err);
      setGroundedResult('Unable to retrieve search grounded data.');
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger PubMed Search
  const handlePubmedSearch = async (termToRun?: string) => {
    const term = termToRun || pubmedQuery;
    setIsPubmedLoading(true);
    try {
      const res = await fetch(`/api/science/pubmed?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      setPubmedArticles(data.articles || []);
    } catch (err) {
      console.error('Failed to fetch PubMed articles:', err);
    } finally {
      setIsPubmedLoading(false);
    }
  };

  // Load initial search on first click if empty
  React.useEffect(() => {
    handlePubmedSearch('spaceflight microgravity hypercapnia');
  }, []);

  const sampleSearchQueries = [
    'NASA astronaut hypercapnia headache threshold ambient CO2',
    'Solar Particle Event space radiation shielding water wall GCR',
    'Spaceflight Associated Neuro-ocular Syndrome SANS optic disc edema',
    'Microgravity orthostatic intolerance Lower Body Negative Pressure',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header and Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Aerospace Medicine &amp; Scientific Evidence Hub
            </h3>
            <p className="text-xs text-slate-400">
              NASA HRP standards, ESA space medicine protocols &amp; PubMed literature citations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Google Search Grounding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pubmed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pubmed'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> PubMed Citations
          </button>
        </div>
      </div>

      {/* Tab 1: Google Search Grounding with Gemini 3.8 Flash */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Quick Query Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">Topics:</span>
            {sampleSearchQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(q);
                  handleSearchGrounding(q);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/60 truncate max-w-[280px]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                placeholder="Query NASA/ESA space medicine guidelines or clinical protocols..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSearchGrounding()}
              disabled={isSearching}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Grounding...' : 'Grounded Search'}</span>
            </button>
          </div>

          {/* Results Area */}
          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
              <p className="text-xs text-slate-400">Querying real-time Google Search data via Gemini-3.8-Flash...</p>
            </div>
          ) : groundedResult ? (
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {groundedResult}
              </div>

              {/* Grounded Web Sources */}
              {groundingSources.length > 0 && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-semibold uppercase text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Grounded Authoritative Sources:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {groundingSources.map((chunk, idx) => {
                      if (!chunk.web?.uri) return null;
                      return (
                        <a
                          key={idx}
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 flex items-center justify-between text-slate-300 hover:text-cyan-300 transition-colors group"
                        >
                          <span className="truncate pr-2">{chunk.web.title || chunk.web.uri}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Real PubMed Literature Search */}
      {activeTab === 'pubmed' && (
        <div className="space-y-4">
          {/* PubMed Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pubmedQuery}
                onChange={(e) => setPubmedQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePubmedSearch()}
                placeholder="Search PubMed (e.g. SANS optic edema, cosmic radiation DNA damage)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
            <button
              type="button"
              onClick={() => handlePubmedSearch()}
              disabled={isPubmedLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isPubmedLoading ? 'Querying...' : 'Search PubMed'}</span>
            </button>
          </div>

          {/* PubMed Articles List */}
          {isPubmedLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Fetching peer-reviewed aerospace biomedical publications...</p>
            </div>
          ) : pubmedArticles.length > 0 ? (
            <div className="space-y-2.5">
              {pubmedArticles.map((art) => (
                <div
                  key={art.uid}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                      {art.title}
                    </h4>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span>PMID: {art.uid}</span>
                    <span>•</span>
                    <span className="text-slate-300">{art.source} ({art.pubdate})</span>
                    <span>•</span>
                    <span className="truncate max-w-[260px] text-slate-400">By: {art.authors}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No articles found. Try queries like &apos;space radiation&apos;, &apos;hypercapnia&apos;, or &apos;microgravity cardiac&apos;.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
