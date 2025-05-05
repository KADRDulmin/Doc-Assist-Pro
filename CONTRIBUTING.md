# Contributing to Doc-Assist-Pro

<div align="center">

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<p align="center">
  <img src="https://via.placeholder.com/700x250?text=Join+the+Doc-Assist-Pro+Community" alt="Doc-Assist-Pro Community Banner" />
</p>

> Thank you for considering contributing to Doc-Assist-Pro! Together we can build better healthcare solutions.

</div>

<p align="center">
  <a href="#code-of-conduct">Code of Conduct</a> •
  <a href="#how-can-i-contribute">How to Contribute</a> •
  <a href="#development-workflow">Development Workflow</a> •
  <a href="#pull-request-process">Pull Request Process</a> •
  <a href="#coding-standards">Coding Standards</a> •
  <a href="#testing-guidelines">Testing Guidelines</a>
</p>

---

## Code of Conduct

This project and everyone participating in it is governed by the Doc-Assist-Pro [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@doc-assist-pro.com](mailto:conduct@doc-assist-pro.com).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Doc-Assist-Pro. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

> **Note:** If you find a **security vulnerability**, please follow our [Security Policy](SECURITY.md) instead of opening an issue.

**Before Submitting A Bug Report:**

* Check the [issues](https://github.com/KADRDulmin/Doc-Assist-Pro/issues) to see if the problem has already been reported
* Perform a search to see if the problem has already been discussed
* Try the latest version to see if the problem has already been fixed

**How to Submit A Good Bug Report:**

Bugs are tracked as [GitHub issues](https://github.com/KADRDulmin/Doc-Assist-Pro/issues). Create an issue and provide the following information:

* **Use a clear and descriptive title** for the issue
* **Describe the exact steps to reproduce the problem** with as much detail as possible
* **Provide specific examples** to demonstrate the steps. Include links to files or GitHub projects, or copy/pasteable snippets
* **Describe the behavior you observed** after following the steps
* **Explain which behavior you expected** to see instead and why
* **Include screenshots or animated GIFs** if possible
* **If the problem is related to performance or memory**, include a CPU profile capture and a memory heap snapshot
* **If the problem is related to the server**, include relevant logs
* **Include details about your configuration and environment**

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Doc-Assist-Pro, including completely new features and minor improvements to existing functionality.

**Before Submitting An Enhancement Suggestion:**

* Check the [issues](https://github.com/KADRDulmin/Doc-Assist-Pro/issues) list to see if the enhancement has already been suggested
* Check if you're using the latest version (your enhancement might already be implemented)
* Search to see if the enhancement has already been suggested

**How to Submit A Good Enhancement Suggestion:**

Enhancement suggestions are tracked as [GitHub issues](https://github.com/KADRDulmin/Doc-Assist-Pro/issues). Create an issue and provide the following information:

* **Use a clear and descriptive title** for the issue
* **Provide a step-by-step description of the suggested enhancement** with as much detail as possible
* **Provide specific examples** to demonstrate the steps or point out the part of Doc-Assist-Pro that the suggestion relates to
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why
* **Include screenshots or animated GIFs** if possible
* **Explain why this enhancement would be useful** to most Doc-Assist-Pro users
* **List some other applications where this enhancement exists**, if applicable
* **Specify which version of Doc-Assist-Pro you're using**
* **Specify the context** you're in (healthcare provider, patient, developer, etc.)

## Development Workflow

### Project Structure

Doc-Assist-Pro consists of several components:

- **Backend**: Node.js/Express.js API server
- **Frontend**: React Native mobile application for patients
- **DAP_Doctor_Portal**: React Native application for healthcare providers

### Setting Up Development Environment

1. **Fork the Repository**

   Start by forking the repository on GitHub, then clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/Doc-Assist-Pro.git
   cd Doc-Assist-Pro
   ```

2. **Set Up Upstream Remote**

   Add the original repository as an upstream remote:

   ```bash
   git remote add upstream https://github.com/KADRDulmin/Doc-Assist-Pro.git
   ```

3. **Install Dependencies**

   For backend:
   ```bash
   cd backend
   npm install
   ```

   For frontend:
   ```bash
   cd frontend
   npm install
   ```

   For doctor portal:
   ```bash
   cd DAP_Doctor_Portal
   npm install
   ```

4. **Set Up Environment Variables**

   Copy the example environment files and update them with your local configuration:

   ```bash
   # In the backend directory
   cp .env.example .env

   # In the frontend directory
   cp .env.example .env

   # In the DAP_Doctor_Portal directory
   cp .env.example .env
   ```

5. **Database Setup**

   Use Docker to set up PostgreSQL:

   ```bash
   docker-compose up -d db
   ```

   Or set up manually as described in the [README.md](README.md#database-management).

6. **Run the Development Servers**

   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm start

   # Doctor Portal
   cd DAP_Doctor_Portal
   npm start
   ```

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Making Changes

1. **Create a New Branch**

   ```bash
   # Update your local develop branch
   git checkout develop
   git pull upstream develop

   # Create a new branch for your changes
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**

   - Write code that follows our [coding standards](#coding-standards)
   - Add or update tests as necessary
   - Update documentation to reflect your changes

3. **Commit Your Changes**

   Use meaningful commit messages that follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

   ```
   feat: add patient appointment reminder functionality
   fix: correct date calculation in scheduling
   docs: update API documentation
   test: add tests for prescription module
   ```

4. **Keep Your Branch Updated**

   ```bash
   git checkout develop
   git pull upstream develop
   git checkout feature/your-feature-name
   git rebase develop
   ```

## Pull Request Process

1. **Push Your Changes**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**

   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your branch and the develop branch of the upstream repository
   - Fill out the PR template with details about your changes

3. **Pull Request Requirements**

   Ensure your PR meets these requirements:

   - The code builds without errors
   - All tests pass
   - New code has adequate test coverage
   - Documentation has been updated
   - The PR description clearly describes the changes
   - The PR references any related issues

4. **Code Review Process**

   - Maintainers will review your code
   - Address any feedback or requested changes
   - Once approved, a maintainer will merge your PR

5. **After Your PR is Merged**

   - Delete your branch
   - Update your local repository
   - Celebrate your contribution! 🎉

## Coding Standards

### General Guidelines

- Write clean, readable, and self-documenting code
- Follow the principle of least privilege and separation of concerns
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Comment your code when necessary, especially for complex logic

### Backend (Node.js/Express)

- Follow the existing architecture pattern (controllers, repositories, models)
- Use async/await for asynchronous operations
- Properly handle errors and edge cases
- Add JSDoc comments for functions
- Follow RESTful API design principles

Example:

```javascript
/**
 * Get a patient by ID
 * @param {string} patientId - The patient's unique identifier
 * @returns {Promise<PatientProfile>} The patient profile
 */
async function getPatientById(patientId) {
  try {
    const patient = await patientRepository.getById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  } catch (error) {
    logger.error(`Error retrieving patient ${patientId}:`, error);
    throw error;
  }
}
```

### Frontend (React Native)

- Use functional components with hooks
- Follow the component structure of the project
- Keep components small and focused
- Use TypeScript for type safety
- Use the theming system for styling
- Follow accessibility best practices

Example:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { useTheme } from '../hooks/useTheme';

interface PatientCardProps {
  name: string;
  age: number;
  condition?: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({ name, age, condition }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <ThemedText style={styles.name}>{name}</ThemedText>
      <ThemedText>Age: {age}</ThemedText>
      {condition && <ThemedText>Condition: {condition}</ThemedText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
```

### Database

- Use consistent naming conventions for tables and columns
- Write clear and efficient SQL queries
- Include appropriate indexes for performance
- Document database schema changes

## Testing Guidelines

### Types of Tests

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows
- **API Tests**: Test API endpoints

### Backend Testing

- Write unit tests for utility functions, services, and models
- Write integration tests for API endpoints
- Use Jest as the testing framework

Example:

```javascript
// patientService.test.js
describe('Patient Service', () => {
  beforeEach(() => {
    // Set up test database or mocks
  });

  it('should retrieve a patient by id', async () => {
    const result = await patientService.getById('123');
    expect(result).toBeDefined();
    expect(result.id).toBe('123');
  });

  it('should throw an error if patient not found', async () => {
    await expect(patientService.getById('nonexistent')).rejects.toThrow('Patient not found');
  });
});
```

### Frontend Testing

- Write unit tests for components and hooks
- Write integration tests for screens
- Use React Testing Library and Jest

Example:

```tsx
// PatientCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PatientCard } from './PatientCard';

describe('PatientCard', () => {
  it('renders patient information correctly', () => {
    render(<PatientCard name="John Doe" age={45} />);
    
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Age: 45')).toBeDefined();
  });

  it('renders condition when provided', () => {
    render(<PatientCard name="John Doe" age={45} condition="Hypertension" />);
    
    expect(screen.getByText('Condition: Hypertension')).toBeDefined();
  });
});
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Doctor Portal tests
cd DAP_Doctor_Portal
npm test
```

## Documentation Guidelines

### Code Documentation

- Use JSDoc for JavaScript/TypeScript code
- Document complex algorithms and business logic
- Update README files when adding new features or changing configuration options

### API Documentation

- Document all API endpoints
- Include request/response examples
- Specify authentication requirements
- List possible error responses

### User Documentation

- Update user guides for new features
- Include screenshots for UI changes
- Provide step-by-step instructions for common tasks

## Additional Resources

- [Project README](README.md)
- [Security Policy](SECURITY.md)
- [License](LICENSE)
- [API Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)

## Get Help

If you need help with the contribution process or have questions about the project:

- **Ask in GitHub Discussions**: Use the [discussions](https://github.com/KADRDulmin/Doc-Assist-Pro/discussions) page
- **Join our Community Chat**: [Link to chat platform]
- **Email the maintainers**: [contributors@doc-assist-pro.com](mailto:contributors@doc-assist-pro.com)

---

<div align="center">

## 💙 Thank You for Contributing!

Your contributions make Doc-Assist-Pro better for everyone. We appreciate your time and effort.

</div>
