import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      info: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, info);
    this.setState({
      info: info.componentStack
    });
  }

  showFullError = () => {
    const { error, info } = this.state;
    const errorDetails = [
      `Error: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'No stack trace available'}`,
      `Component: ${info || 'No component info available'}`
    ].join('\n\n');

    Alert.alert(
      "Technical Error Details",
      "This information can help with debugging:",
      [
        { text: "OK" },
      ],
      { cancelable: true }
    );

    // Also log to console for easier debugging
    console.log("========= ERROR DETAILS =========");
    console.log(errorDetails);
    console.log("================================");
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, info: null });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "Something went wrong";
      
      return (
        <View style={styles.container}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <View style={styles.buttonsContainer}>
            <Button title="Show Details" onPress={this.showFullError} />
            <Button title="Try Again" onPress={this.resetError} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  }
});

export default ErrorBoundary;
