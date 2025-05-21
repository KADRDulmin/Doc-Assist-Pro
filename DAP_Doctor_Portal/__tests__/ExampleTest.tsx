import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Simple component to test
export const CustomText = ({ children }) => <Text testID="custom-text">{children}</Text>;

export function ExampleScreen() {
  return (
    <View>
      <CustomText>Welcome to Doc Assist Pro!</CustomText>
    </View>
  );
}

describe('<ExampleScreen />', () => {
  test('Text renders correctly on ExampleScreen', () => {
    const { getByText } = render(<ExampleScreen />);
    const welcomeElement = getByText('Welcome to Doc Assist Pro!');
    expect(welcomeElement).toBeTruthy();
  });

  test('CustomText renders correctly', () => {
    const { getByTestId } = render(<CustomText>Some text</CustomText>);
    const textElement = getByTestId('custom-text');
    expect(textElement).toBeTruthy();
  });

  test('Snapshot test for CustomText', () => {
    const tree = render(<CustomText>Some text</CustomText>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
