import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "32px", textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <p>Please refresh the page or try again later.</p>
          <pre style={{ color: "red" }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
