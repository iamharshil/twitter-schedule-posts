
export default function Loader() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
            }}
        >
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-labelledby="loaderTitle"
                style={{ animation: "spin 1s linear infinite" }}
            >
                <title id="loaderTitle">Loading</title>
                <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="#888"
                    strokeWidth="4"
                    strokeDasharray="90"
                    strokeDashoffset="60"
                    strokeLinecap="round"
                />
                <style>
                    {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                </style>
            </svg>
        </div>
    )
}