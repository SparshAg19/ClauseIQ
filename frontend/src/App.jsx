import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files[0];

    handleFile(droppedFile);
  };

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

      const response = await fetch(
        "http://127.0.0.1:8000/review",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to review PDF");
      }

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error(error);
      alert(
        "Something went wrong while reviewing the document."
      );
    } finally {
      setLoading(false);
    }
  };

  const getClauseClass = (type) => {
    const value = type?.toLowerCase() || "";

    if (value.includes("obligation")) {
      return "badge-obligation";
    }

    if (value.includes("indemn")) {
      return "badge-indemnification";
    }

    if (value.includes("termination")) {
      return "badge-termination";
    }

    if (value.includes("liability")) {
      return "badge-liability";
    }

    if (value.includes("confidential")) {
      return "badge-confidential";
    }

    return "badge-default";
  };

  return (
    <div className="app">

      <div className="container">

        {/* Header */}

        <header className="header">

          <div className="brand">
            <div className="logo">
              ClauseIQ
            </div>

            <span className="beta-badge">
              AI Legal Review
            </span>
          </div>

          <p className="tagline">
            Understand what your contract actually says.
          </p>

        </header>


        {/* Upload Card */}

        <section className="upload-card">

          <div className="upload-content">

            <div className="eyebrow">
              DOCUMENT REVIEW
            </div>

            <h1 className="upload-title">
              Find the clauses
              <br />
              <span>
                you shouldn't overlook.
              </span>
            </h1>

            <p className="upload-description">
              Upload a legal document and ClauseIQ will
              identify important obligations, restrictions,
              and clauses that may deserve your attention.
            </p>

          </div>


          {/* Drag & Drop */}

          <label
            className={`upload-area ${
              isDragging ? "dragging" : ""
            } ${file ? "file-selected" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();

              if (!loading) {
                setIsDragging(true);
              }
            }}
            onDragLeave={() => {
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >

            <div className="upload-text">

              <div className="upload-main-text">
                {file
                  ? file.name
                  : "Drag & drop your PDF here"}
              </div>

              <div className="upload-subtext">
                {file
                  ? "PDF selected and ready for review"
                  : "or choose a file from your computer"}
              </div>

            </div>


            <span className="choose-file">
              {file ? "Change PDF" : "Choose PDF"}

              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={loading}
                onChange={(event) => {
                  handleFile(
                    event.target.files[0]
                  );
                }}
              />
            </span>

          </label>


          {/* Review Button */}

          <button
            className="review-button"
            onClick={reviewPDF}
            disabled={loading}
          >
            {loading
              ? "Reviewing document..."
              : "Review PDF"}
          </button>


          {/* Loading */}

          {loading && (
            <div className="loading-container">

              <div className="loading-header">

                <span>
                  Analyzing your document
                </span>

                <span className="loading-dots">
                  ...
                </span>

              </div>

              <div className="progress-track">

                <div className="progress-indicator"></div>

              </div>

              <div className="loading-subtext">
                ClauseIQ is reading the document and
                identifying important clauses.
              </div>

            </div>
          )}

        </section>


        {/* Preview Section */}

        {!result && !loading && (
          <section className="preview-section">

            <div className="section-heading">

              <div>

                <div className="eyebrow">
                  WHAT YOU GET
                </div>

                <h2>
                  A clearer way to read contracts.
                </h2>

              </div>

            </div>


            <div className="preview-grid">

              <div className="preview-card">

                <div className="image-placeholder">

                  <span>
                    Sample contract preview
                  </span>

                  <small>
                    Replace with your screenshot
                  </small>

                </div>

                <div className="preview-info">

                  <strong>
                    Original clause
                  </strong>

                  <p>
                    See the exact wording ClauseIQ
                    found in the document.
                  </p>

                </div>

              </div>


              <div className="preview-card">

                <div className="image-placeholder">

                  <span>
                    Sample AI explanation
                  </span>

                  <small>
                    Replace with your screenshot
                  </small>

                </div>

                <div className="preview-info">

                  <strong>
                    Plain-English explanation
                  </strong>

                  <p>
                    Understand what the clause means
                    and why it matters.
                  </p>

                </div>

              </div>

            </div>

          </section>
        )}


        {/* Results */}

        {result?.review?.clauses && (
          <section className="results">

            <div className="results-header">

              <div>

                <div className="eyebrow">
                  DOCUMENT ANALYSIS
                </div>

                <h2 className="results-title">
                  Review Results
                </h2>

              </div>

              <div className="results-count">
                {result.review.clauses.length} clauses identified
              </div>

            </div>


            {/* Document Info */}

            <div className="document-info">

              <div className="document-icon">
                PDF
              </div>

              <div>

                <div className="document-name">
                  {result.filename}
                </div>

                <div className="document-status">
                  Analysis completed
                </div>

              </div>

            </div>


            {/* Clauses */}

            <div className="clauses">

              {result.review.clauses.map(
                (clause, index) => (

                  <article
                    className="clause-card"
                    key={index}
                  >

                    <div className="clause-header">

                      <div className="clause-title-row">

                        <span className="clause-number">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <h3 className="clause-type">
                          {clause.type}
                        </h3>

                      </div>

                      <span className="page-number">
                        Page {clause.page}
                      </span>

                    </div>


                    <div className="clause-badge-row">

                      <span
                        className={`clause-badge ${getClauseClass(
                          clause.type
                        )}`}
                      >
                        {clause.type}
                      </span>

                    </div>


                    <div className="section">

                      <h4 className="section-title">
                        Original Clause
                      </h4>

                      <div className="original-clause">
                        {clause.original}
                      </div>

                    </div>


                    <div className="section">

                      <h4 className="section-title">
                        Plain English
                      </h4>

                      <p className="section-text">
                        {clause.explanation}
                      </p>

                    </div>


                    <div className="section why-section">

                      <h4 className="section-title">
                        Why It Matters
                      </h4>

                      <p className="section-text">
                        {clause.why_it_matters}
                      </p>

                    </div>

                  </article>

                )
              )}

            </div>

          </section>
        )}

      </div>

    </div>
  );
}

export default App;