// This file allows TypeScript to recognize the @testing-library/react-native module
declare module '@testing-library/react-native' {
  import { ReactElement } from 'react';
  
  // Core queries
  export function render(ui: ReactElement, options?: any): {
    container: any;
    debug: (message?: string) => void;
    unmount: () => void;
    rerender: (ui: ReactElement) => void;
    asJSON: () => any;
    toJSON: () => any;
    getByTestId: (id: string) => any;
    getByText: (text: string | RegExp) => any;
    getByPlaceholderText: (text: string | RegExp) => any;
    getByDisplayValue: (value: string | RegExp) => any;
    getByLabelText: (label: string | RegExp) => any;
    getAllByTestId: (id: string | RegExp) => any[];
    getAllByText: (text: string | RegExp) => any[];
    getAllByPlaceholderText: (text: string | RegExp) => any[];
    getAllByDisplayValue: (value: string | RegExp) => any[];
    getAllByLabelText: (label: string | RegExp) => any[];
    queryByTestId: (id: string | RegExp) => any | null;
    queryByText: (text: string | RegExp) => any | null;
    queryByPlaceholderText: (text: string | RegExp) => any | null;
    queryByDisplayValue: (value: string | RegExp) => any | null;
    queryByLabelText: (label: string | RegExp) => any | null;
    queryAllByTestId: (id: string | RegExp) => any[];
    queryAllByText: (text: string | RegExp) => any[];
    queryAllByPlaceholderText: (text: string | RegExp) => any[];
    queryAllByDisplayValue: (value: string | RegExp) => any[];
    queryAllByLabelText: (label: string | RegExp) => any[];
    findByTestId: (id: string | RegExp) => Promise<any>;
    findByText: (text: string | RegExp) => Promise<any>;
    findByPlaceholderText: (text: string | RegExp) => Promise<any>;
    findByDisplayValue: (value: string | RegExp) => Promise<any>;
    findByLabelText: (label: string | RegExp) => Promise<any>;
    findAllByTestId: (id: string | RegExp) => Promise<any[]>;
    findAllByText: (text: string | RegExp) => Promise<any[]>;
    findAllByPlaceholderText: (text: string | RegExp) => Promise<any[]>;
    findAllByDisplayValue: (value: string | RegExp) => Promise<any[]>;
    findAllByLabelText: (label: string | RegExp) => Promise<any[]>;
    UNSAFE_getByType: (type: any) => any;
    UNSAFE_getAllByType: (type: any) => any[];
    UNSAFE_queryByType: (type: any) => any | null;
    UNSAFE_queryAllByType: (type: any) => any[];
    UNSAFE_getByProps: (props: Record<string, any>) => any;
    UNSAFE_getAllByProps: (props: Record<string, any>) => any[];
    UNSAFE_queryByProps: (props: Record<string, any>) => any | null;
    UNSAFE_queryAllByProps: (props: Record<string, any>) => any[];
    UNSAFE_root: any;
  };
  
  export function screen(options?: any): {
    container: any;
    debug: (message?: string) => void;
    unmount: () => void;
    rerender: (ui: ReactElement) => void;
    asJSON: () => any;
    toJSON: () => any;
    getByTestId: (id: string) => any;
    getByText: (text: string | RegExp) => any;
    getByPlaceholderText: (text: string | RegExp) => any;
    getByDisplayValue: (value: string | RegExp) => any;
    getByLabelText: (label: string | RegExp) => any;
    getAllByTestId: (id: string | RegExp) => any[];
    getAllByText: (text: string | RegExp) => any[];
    getAllByPlaceholderText: (text: string | RegExp) => any[];
    getAllByDisplayValue: (value: string | RegExp) => any[];
    getAllByLabelText: (label: string | RegExp) => any[];
    queryByTestId: (id: string | RegExp) => any | null;
    queryByText: (text: string | RegExp) => any | null;
    queryByPlaceholderText: (text: string | RegExp) => any | null;
    queryByDisplayValue: (value: string | RegExp) => any | null;
    queryByLabelText: (label: string | RegExp) => any | null;
    queryAllByTestId: (id: string | RegExp) => any[];
    queryAllByText: (text: string | RegExp) => any[];
    queryAllByPlaceholderText: (text: string | RegExp) => any[];
    queryAllByDisplayValue: (value: string | RegExp) => any[];
    queryAllByLabelText: (label: string | RegExp) => any[];
    findByTestId: (id: string | RegExp) => Promise<any>;
    findByText: (text: string | RegExp) => Promise<any>;
    findByPlaceholderText: (text: string | RegExp) => Promise<any>;
    findByDisplayValue: (value: string | RegExp) => Promise<any>;
    findByLabelText: (label: string | RegExp) => Promise<any>;
    findAllByTestId: (id: string | RegExp) => Promise<any[]>;
    findAllByText: (text: string | RegExp) => Promise<any[]>;
    findAllByPlaceholderText: (text: string | RegExp) => Promise<any[]>;
    findAllByDisplayValue: (value: string | RegExp) => Promise<any[]>;
    findAllByLabelText: (label: string | RegExp) => Promise<any[]>;
    UNSAFE_getByType: (type: any) => any;
    UNSAFE_getAllByType: (type: any) => any[];
    UNSAFE_queryByType: (type: any) => any | null;
    UNSAFE_queryAllByType: (type: any) => any[];
  };
  
  // Firevent
  export const fireEvent: {
    (element: any, eventName: string, eventProperties?: object): void;
    press: (element: any) => void;
    changeText: (element: any, text: string) => void;
    scroll: (element: any, options: { nativeEvent: object }) => void;
    focus: (element: any) => void;
    blur: (element: any) => void;
  };

  // Wait utilities
  export function waitFor(callback: () => any, options?: { timeout?: number, interval?: number }): Promise<void>;
  export function waitForElementToBeRemoved(callback: () => any, options?: { timeout?: number, interval?: number }): Promise<void>;
}
