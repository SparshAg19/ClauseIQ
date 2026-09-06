import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import "./App.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();


function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const [viewMode, setViewMode] = useState("document");

  const [selectedClause, setSelectedClause] = useState(null);


  /* =================================
     Create temporary PDF URL
     ================================= */

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


  /* =================================
     File handling
     ================================= */

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

    const droppedFile = event.dataTransfer.files[0];

    handleFile(droppedFile);
  };


  /* =================================
     Send PDF to backend
     ================================= */

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


  /* =================================
     Severity
     ================================= */

  const getSeverityClass = (severity) => {

    const value =
      severity?.toUpperCase() || "MEDIUM";

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


  /* =================================
     Clause type
     ================================= */

  const getClauseClass = (type) => {

    const value =
      type?.toLowerCase() || "";

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


  /* =================================
     Apply highlights AFTER PDF renders
     ================================= */

  useEffect(() => {

    if (
      !result ||
      viewMode !== "document" ||
      !numPages
    ) {
      return;
    }


    /*
     * Give react-pdf a moment to finish
     * creating the text layer.
     */

    const timer = setTimeout(() => {

      const clauses =
        result.review?.clauses || [];


      document
        .querySelectorAll(".pdf-page")
        .forEach((pageElement, pageIndex) => {

          const pageNumber =
            pageIndex + 1;


          const pageClauses =
            clauses.filter(
              (clause) =>
                Number(clause.page) === pageNumber
            );


          const textSpans =
            Array.from(
              pageElement.querySelectorAll(
                ".react-pdf__Page__textContent span"
              )
            );


          if (!textSpans.length) {
            return;
          }


          /*
           * Reset previous highlights.
           */

          textSpans.forEach((span) => {

            span.classList.remove(
              "clause-highlight",
              "severity-high",
              "severity-medium",
              "severity-low"
            );

            span.removeAttribute(
              "data-clause-index"
            );

          });


          /*
           * Find each AI clause inside the
           * PDF text layer.
           */

          pageClauses.forEach((clause) => {

            const clauseText =
              normalizeText(clause.original);


            if (!clauseText) {
              return;
            }


            /*
             * Build one continuous text string
             * from all PDF text spans.
             */

            let combinedText = "";

            const ranges = [];


            textSpans.forEach((span) => {

              const text =
                normalizeText(
                  span.textContent
                );


              if (!text) {
                return;
              }


              const start =
                combinedText.length;


              if (combinedText.length > 0) {
                combinedText += " ";
              }


              combinedText += text;


              const end =
                combinedText.length;


              ranges.push({
                span,
                start,
                end,
              });

            });


            /*
             * Find the clause inside the
             * combined PDF text.
             */

            const startIndex =
              combinedText.indexOf(
                clauseText
              );


            if (startIndex === -1) {
              return;
            }


            const endIndex =
              startIndex + clauseText.length;


            const clauseIndex =
              clauses.indexOf(clause);


            /*
             * Highlight every PDF span that
             * overlaps the detected clause.
             */

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
                getSeverityClass(
                  clause.severity
                )
              );


              range.span.dataset.clauseIndex =
                clauseIndex;

            });

          });

        });

    }, 500);


    return () => {
      clearTimeout(timer);
    };

  }, [result, viewMode, numPages]);


  /* =================================
     Highlight click
     ================================= */

  const handlePdfClick = (event) => {

    const target =
      event.target.closest(
        ".clause-highlight"
      );


    if (!target) {
      return;
    }


    const index =
      Number(
        target.dataset.clauseIndex
      );


    const clause =
      result?.review?.clauses?.[index];


    if (clause) {
      setSelectedClause(clause);
    }
  };


  return (
    <div className="app">

      <div className="container">


        {/* =================================
            HEADER
            ================================= */}

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


        {/* =================================
            UPLOAD
            ================================= */}

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

                Upload a legal document and ClauseIQ
                will identify important obligations,
                restrictions, and clauses that may
                deserve your attention.

              </p>

            </div>


            <label
              className={`upload-area ${
                isDragging
                  ? "dragging"
                  : ""
              } ${
                file
                  ? "file-selected"
                  : ""
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
              disabled={loading}
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

                  <div className="progress-indicator"></div>

                </div>


                <div className="loading-subtext">

                  ClauseIQ is reading the document
                  and identifying important clauses.

                </div>

              </div>

            )}

          </section>

        )}


        {/* =================================
            RESULTS
            ================================= */}

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

                {result.review.clauses.length}
                {" "}
                clauses identified

              </div>

            </div>


            {/* Document */}

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


            {/* View Toggle */}

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
                PDF
                ================================= */}

            {viewMode === "document" &&
              pdfUrl && (

                <div
                  className="pdf-viewer"
                  onClick={handlePdfClick}
                >

                  <Document
                    file={pdfUrl}

                    onLoadSuccess={({
                      numPages
                    }) => {

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
                      new Array(numPages),
                      (_, index) => {

                        const pageNumber =
                          index + 1;


                        return (

                          <div
                            className="pdf-page"
                            key={
                              `page_${pageNumber}`
                            }
                          >

                            <Page
                              pageNumber={
                                pageNumber
                              }

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

              )}


            {/* =================================
                POPUP
                ================================= */}

            {selectedClause && (

              <div className="clause-popup">

                <div className="clause-popup-header">

                  <div>

                    <div className="clause-popup-type">
                      {selectedClause.type}
                    </div>

                    <div
                      className={`severity-badge ${getSeverityClass(
                        selectedClause.severity
                      )}`}
                    >
                      {selectedClause.severity}
                    </div>

                  </div>


                  <button
                    className="close-popup"
                    onClick={() => {
                      setSelectedClause(null);
                    }}
                  >
                    ×
                  </button>

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

            {viewMode === "clauses" && (

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
                            {String(
                              index + 1
                            ).padStart(2, "0")}
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
                          className={`severity-badge ${getSeverityClass(
                            clause.severity
                          )}`}
                        >
                          {clause.severity}
                        </span>


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

            )}

          </section>

        )}

      </div>

    </div>
  );
}

export default App;