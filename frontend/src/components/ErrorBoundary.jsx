import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can wire this into a logging service later.
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "1rem",
            color: "#f97373",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          }}
        >
          Something went wrong. Please refresh the page and try again.
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
