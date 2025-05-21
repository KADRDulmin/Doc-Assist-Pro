import React from 'react';
import { render } from '@testing-library/react-native';
import ModernHeader from '../components/ui/ModernHeader';

describe('<ModernHeader />', () => {
  test('renders the header with default props', () => {
    const { getByText } = render(<ModernHeader />);
    
    // Check if the default title is rendered
    expect(getByText('Doc Assist Pro')).toBeTruthy();
  });

  test('renders the header with custom title', () => {
    const { getByText } = render(
      <ModernHeader title="Custom Title" />
    );
    
    // Check if the custom title is rendered
    expect(getByText('Custom Title')).toBeTruthy();
  });

  test('snapshot test for ModernHeader', () => {
    const tree = render(<ModernHeader />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
