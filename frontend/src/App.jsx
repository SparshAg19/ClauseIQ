import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import "./App.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();


// =========================================
// Load editorial font
// =========================================

const loadFonts = () => {
  if (document.getElementById("clauseiq-fonts")) {
    return;
  }

  const link = document.createElement("link");

  link.id = "clauseiq-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap";

  document.head.appendChild(link);
};

loadFonts();


// =========================================
// Normalize PDF text
// =========================================

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// =========================================
// APP
// =========================================

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const [viewMode, setViewMode] = useState("document");

  const [selectedClause, setSelectedClause] = useState(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("clauseiq-theme") || "light";
  });


  // =========================================
  // Theme
  // =========================================

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("clauseiq-theme", theme);
  }, [theme]);


  const toggleTheme = () => {
    setTheme((previousTheme) =>
      previousTheme === "light" ? "dark" : "light"
    );
  };


  // =========================================
  // Create temporary PDF URL
  // =========================================

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);

    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);


  // =========================================
  // File handling
  // =========================================

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
    setSelectedClause(null);
    setNumPages(null);
    setViewMode("document");
  };


  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    if (loading) {
      return;
    }

    const droppedFile = event.dataTransfer.files[0];

    handleFile(droppedFile);
  };


  // =========================================
  // Send PDF to backend
  // =========================================

  const reviewPDF = async () => {
    if (!file) {
      alert("Please select a PDF first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedClause(null);

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


  // =========================================
  // Severity class
  // =========================================

  const getSeverityClass = (severity) => {
    const value = severity?.toUpperCase() || "MEDIUM";

    if (value === "HIGH") {
      return "severity-high";
    }

    if (value === "MEDIUM") {
      return "severity-medium";
    }

    if (value === "LOW") {
      return "severity-low";
    }

    return "severity-medium";
  };


  // =========================================
  // Clause type class
  // =========================================

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


  // =========================================
  // Highlight clauses inside PDF
  // =========================================

  useEffect(() => {
    if (
      !result ||
      viewMode !== "document" ||
      !numPages
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const clauses = result.review?.clauses || [];

      const pages = document.querySelectorAll(".pdf-page");

      pages.forEach((pageElement, pageIndex) => {
        const pageNumber = pageIndex + 1;

        const pageClauses = clauses.filter(
          (clause) =>
            Number(clause.page) === pageNumber
        );

        const textSpans = Array.from(
          pageElement.querySelectorAll(
            ".react-pdf__Page__textContent span"
          )
        );

        if (!textSpans.length) {
          return;
        }


        // Remove old highlights

        textSpans.forEach((span) => {
          span.classList.remove(
            "clause-highlight",
            "severity-high",
            "severity-medium",
            "severity-low"
          );

          span.removeAttribute("data-clause-index");
        });


        // Process each clause

        pageClauses.forEach((clause) => {
          const clauseText = normalizeText(
            clause.original
          );

          if (!clauseText) {
            return;
          }


          // Build combined text

          let combinedText = "";

          const ranges = [];

          textSpans.forEach((span) => {
            const text = normalizeText(
              span.textContent
            );

            if (!text) {
              return;
            }

            if (combinedText.length > 0) {
              combinedText += " ";
            }

            const start = combinedText.length;

            combinedText += text;

            const end = combinedText.length;

            ranges.push({
              span,
              start,
              end,
            });
          });


          // Find clause

          const startIndex =
            combinedText.indexOf(clauseText);

          if (startIndex === -1) {
            return;
          }

          const endIndex =
            startIndex + clauseText.length;

          const clauseIndex =
            clauses.indexOf(clause);


          // Highlight matching spans

          ranges.forEach((range) => {
            const overlaps =
              range.end > startIndex &&
              range.start < endIndex;

            if (!overlaps) {
              return;
            }

            range.span.classList.add(
              "clause-highlight"
            );

            range.span.classList.add(
              getSeverityClass(clause.severity)
            );

            range.span.dataset.clauseIndex =
              String(clauseIndex);
          });
        });
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [result, viewMode, numPages]);


  // =========================================
  // Click highlighted clause
  // =========================================

  const handlePdfClick = (event) => {
    let element = event.target;

    while (
      element &&
      element !== event.currentTarget
    ) {
      if (
        element.classList &&
        element.classList.contains(
          "clause-highlight"
        )
      ) {
        const index = Number(
          element.dataset.clauseIndex
        );

        const clause =
          result?.review?.clauses?.[index];

        if (clause) {
          setSelectedClause(clause);
        }

        return;
      }

      element = element.parentElement;
    }
  };


  // =========================================
  // Render
  // =========================================

  return (
    <div className="app">

      <div className="container">


        {/* =====================================
            HEADER
            ===================================== */}

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
            Understand what your contract
            actually says.
          </p>


          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
          >

            <div
              className={`theme-toggle-icon ${
                theme === "light"
                  ? "active"
                  : ""
              }`}
              aria-hidden="true"
            >

              <svg
                className="sun-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <circle
                  cx="12"
                  cy="12"
                  r="5"
                />

                <line
                  x1="12"
                  y1="1"
                  x2="12"
                  y2="3"
                />

                <line
                  x1="12"
                  y1="21"
                  x2="12"
                  y2="23"
                />

                <line
                  x1="4.22"
                  y1="4.22"
                  x2="5.64"
                  y2="5.64"
                />

                <line
                  x1="18.36"
                  y1="18.36"
                  x2="19.78"
                  y2="19.78"
                />

                <line
                  x1="1"
                  y1="12"
                  x2="3"
                  y2="12"
                />

                <line
                  x1="21"
                  y1="12"
                  x2="23"
                  y2="12"
                />

                <line
                  x1="4.22"
                  y1="19.78"
                  x2="5.64"
                  y2="18.36"
                />

                <line
                  x1="18.36"
                  y1="5.64"
                  x2="19.78"
                  y2="4.22"
                />

              </svg>

            </div>


            <div
              className={`theme-toggle-icon ${
                theme === "dark"
                  ? "active"
                  : ""
              }`}
              aria-hidden="true"
            >

              <svg
                className="moon-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />

              </svg>

            </div>

          </button>

        </header>


        {/* =====================================
            UPLOAD
            ===================================== */}

        {!result && (

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
                Upload a legal document and
                ClauseIQ will identify important
                obligations, restrictions, and
                clauses that may deserve your
                attention.
              </p>

            </div>


            <label
              className={`upload-area ${
                isDragging ? "dragging" : ""
              } ${
                file ? "file-selected" : ""
              }`}

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

                {file
                  ? "Change PDF"
                  : "Choose PDF"}

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


            <button
              className="review-button"
              onClick={reviewPDF}
              disabled={loading || !file}
            >
              {loading
                ? "Reviewing document..."
                : "Review PDF"}
            </button>


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
                  <div className="progress-indicator" />
                </div>


                <div className="loading-subtext">
                  ClauseIQ is reading the
                  document and identifying
                  important clauses.
                </div>

              </div>

            )}

          </section>

        )}


        {/* =====================================
            RESULTS
            ===================================== */}

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


            {/* Document info */}

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


            {/* View toggle */}

            <div className="view-toggle">

              <button
                className={
                  viewMode === "document"
                    ? "view-button active"
                    : "view-button"
                }
                onClick={() => {
                  setViewMode("document");
                  setSelectedClause(null);
                }}
              >
                Document View
              </button>


              <button
                className={
                  viewMode === "clauses"
                    ? "view-button active"
                    : "view-button"
                }
                onClick={() => {
                  setViewMode("clauses");
                  setSelectedClause(null);
                }}
              >
                Clause View
              </button>

            </div>


            {/* =================================
                DOCUMENT VIEW
                ================================= */}

            <div
              className={`pdf-viewer ${
                viewMode === "document"
                  ? "active"
                  : ""
              }`}
              onClick={handlePdfClick}
            >

              <Document
                file={pdfUrl}

                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                }}

                onLoadError={(error) => {
                  console.error(
                    "PDF loading error:",
                    error
                  );
                }}
              >

                {Array.from(
                  new Array(numPages || 0),
                  (_, index) => {

                    const pageNumber =
                      index + 1;

                    return (

                      <div
                        className="pdf-page"
                        key={`page_${pageNumber}`}
                      >

                        <Page
                          pageNumber={pageNumber}
                          width={800}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />

                      </div>

                    );
                  }
                )}

              </Document>

            </div>


            {/* =================================
                CLAUSE POPUP
                ================================= */}

            {selectedClause && (

              <div className="clause-popup">

                <div className="clause-popup-header">

                  <div>

                    <div className="clause-popup-type">
                      {selectedClause.type}
                    </div>

                    <div
                      className={`severity-badge ${
                        getSeverityClass(
                          selectedClause.severity
                        )
                      }`}
                    >
                      {selectedClause.severity}
                    </div>

                  </div>


                  <button
                    className="close-popup"
                    onClick={() => {
                      setSelectedClause(null);
                    }}
                    aria-label="Close clause details"
                  >
                    ×
                  </button>

                </div>


                <div className="popup-section">

                  <div className="popup-title">
                    Original Clause
                  </div>

                  <p>
                    {selectedClause.original}
                  </p>

                </div>


                <div className="popup-section">

                  <div className="popup-title">
                    Plain English
                  </div>

                  <p>
                    {selectedClause.explanation}
                  </p>

                </div>


                <div className="popup-section">

                  <div className="popup-title">
                    Why It Matters
                  </div>

                  <p>
                    {selectedClause.why_it_matters}
                  </p>

                </div>

              </div>

            )}


            {/* =================================
                CLAUSE VIEW
                ================================= */}

            <div
              className={`clauses ${
                viewMode === "clauses"
                  ? "active"
                  : ""
              }`}
            >

              {result.review.clauses.map(
                (clause, index) => (

                  <article
                    className={`clause-card ${getSeverityClass(
                      clause.severity
                    )}`}
                    key={index}
                  >

                    <div className="clause-header">

                      <div className="clause-title-row">

                        <span className="clause-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <h3 className="clause-type">
                          {clause.type}
                        </h3>

                      </div>


                      <span className="page-number">
                        Page {clause.page}
                      </span>

                    </div>


                    <div className="severity-row">

                      <span
                        className={`severity-badge ${
                          getSeverityClass(
                            clause.severity
                          )
                        }`}
                      >
                        {clause.severity}
                      </span>


                      <span
                        className={`clause-badge ${
                          getClauseClass(
                            clause.type
                          )
                        }`}
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