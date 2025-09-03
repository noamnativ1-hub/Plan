import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 rounded-lg max-w-2xl mx-auto my-8">
          <h2 className="text-2xl font-bold mb-4">משהו השתבש</h2>
          <p className="mb-4">אירעה שגיאה בטעינת הדף.</p>
          
          <div className="bg-white p-4 rounded-md">
            <p className="font-semibold mb-2">פרטי השגיאה:</p>
            <pre className="text-sm overflow-x-auto p-2 bg-gray-100 rounded">
              {this.state.error && this.state.error.toString()}
            </pre>
            
            {this.state.errorInfo && (
              <div className="mt-4">
                <p className="font-semibold mb-2">מיקום השגיאה:</p>
                <pre className="text-sm overflow-x-auto p-2 bg-gray-100 rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
          
          <button
            className="mt-6 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            רענן דף
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;