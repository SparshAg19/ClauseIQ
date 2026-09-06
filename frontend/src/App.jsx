import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const reviewPDF = async () => {
    if (!file) {
      alert("Please select a PDF first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/review", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to review PDF");
      }

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while reviewing the document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">

        {/* Header */}
        <header className="header">
          <div className="logo">ClauseIQ</div>

          <div className="tagline">
            Understand what your contract actually says.
          </div>
        </header>

        {/* Upload Card */}
        <section className="upload-card">

          <h1 className="upload-title">
            Review your legal document
          </h1>

          <p className="upload-description">
            Upload a PDF and identify important clauses, obligations, and
            potential areas of concern.
          </p>

          <div className="upload-row">

            <input
              className="file-input"
              type="file"
              accept=".pdf"
              disabled={loading}
              onChange={(event) => {
                setFile(event.target.files[0]);
                setResult(null);
              }}
            />

            <button
              className="review-button"
              onClick={reviewPDF}
              disabled={loading}
            >
              {loading ? "Reviewing..." : "Review PDF"}
            </button>

          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-container">

              <div className="loading-text">
                Reviewing your document...
              </div>

              <div className="progress-track">
                <div className="progress-indicator"></div>
              </div>

              <div className="loading-subtext">
                This may take a moment while the document is analyzed.
              </div>

            </div>
          )}

        </section>

        {/* Results */}
        {result && result.review && result.review.clauses && (
          <section className="results">

            <div className="results-header">

              <h2 className="results-title">
                Review Results
              </h2>

              <span className="results-count">
                {result.review.clauses.length} clauses identified
              </span>

            </div>

            {result.review.clauses.map((clause, index) => (

              <article
                className="clause-card"
                key={index}
              >

                <div className="clause-header">

                  <h3 className="clause-type">
                    {clause.type}
                  </h3>

                  <span className="page-number">
                    Page {clause.page}
                  </span>

                </div>

                <div className="section">

                  <h4 className="section-title">
                    Original Clause
                  </h4>

                  <p className="section-text original-clause">
                    {clause.original}
                  </p>

                </div>

                <div className="section">

                  <h4 className="section-title">
                    Plain English
                  </h4>

                  <p className="section-text">
                    {clause.explanation}
                  </p>

                </div>

                <div className="section">

                  <h4 className="section-title">
                    Why It Matters
                  </h4>

                  <p className="section-text">
                    {clause.why_it_matters}
                  </p>

                </div>

              </article>

            ))}

          </section>
        )}

      </div>
    </div>
  );
}

export default App;