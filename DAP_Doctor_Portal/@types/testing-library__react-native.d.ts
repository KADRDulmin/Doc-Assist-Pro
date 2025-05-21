// Basic declaration file for @testing-library/react-native
declare module '@testing-library/react-native' {
  import { ReactElement } from 'react';

  export function render(component: ReactElement, options?: any): {
    getByText: (text: string | RegExp) => any;
    getByTestId: (testId: string) => any;
    getAllByText: (text: string | RegExp) => any[];
    getAllByTestId: (testId: string) => any[];
    queryByText: (text: string | RegExp) => any | null;
    queryByTestId: (testId: string) => any | null;
    queryAllByText: (text: string | RegExp) => any[];
    queryAllByTestId: (testId: string) => any[];
    UNSAFE_getByProps: (props: Record<string, any>) => any;
    UNSAFE_getAllByProps: (props: Record<string, any>) => any[];
    UNSAFE_queryByProps: (props: Record<string, any>) => any | null;
    UNSAFE_queryAllByProps: (props: Record<string, any>) => any[];
  }
  
  export const screen: any;
  
  export const fireEvent: any;
  
  export function waitFor(callback: () => any | Promise<any>, options?: any): Promise<void>;
  
  export function cleanup(): void;
}
