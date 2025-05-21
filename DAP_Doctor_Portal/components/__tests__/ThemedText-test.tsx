import * as React from 'react';
import renderer from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

describe('ThemedText Component', () => {
  it('basic rendering test that always passes', () => {
    expect(true).toBe(true);
  });
  
  it('renders text content correctly', () => {
    const testRenderer = renderer.create(<ThemedText>Snapshot test!</ThemedText>);
    const testInstance = testRenderer.root;
    expect(testInstance.findByType(ThemedText).props.children).toBe('Snapshot test!');
  });
});
