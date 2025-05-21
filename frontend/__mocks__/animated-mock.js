// This file mocks the Animated module from React Native
const animatedMock = {
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => ({
      __getValue: jest.fn(() => 0),
    })),
  })),
  View: 'AnimatedView',
  Text: 'AnimatedText',
  Image: 'AnimatedImage',
  ScrollView: 'AnimatedScrollView',
  timing: jest.fn(() => ({
    start: callback => {
      if (callback) {
        callback({ finished: true });
      }
    },
  })),
  spring: jest.fn(() => ({
    start: callback => {
      if (callback) {
        callback({ finished: true });
      }
    },
  })),
  parallel: jest.fn(animations => ({
    start: callback => {
      if (callback) {
        callback({ finished: true });
      }
    },
  })),
  createAnimatedComponent: jest.fn(component => component),
  event: jest.fn(),
};

export default animatedMock;
