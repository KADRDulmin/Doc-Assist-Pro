// This file contains simplified type declarations for React Native Testing Library
declare module '@testing-library/react-native' {
  import { ReactElement } from 'react';

  export interface RenderOptions {
    wrapper?: React.ComponentType<any>;
    createNodeMock?: (element: ReactElement) => any;
    textRange?: { from?: number; to?: number };
  }

  export interface RenderAPI {
    container: any;
    getByTestId: (id: string) => any;
    getAllByTestId: (id: string) => any[];
    queryByTestId: (id: string) => any | null;
    queryAllByTestId: (id: string) => any[];
    getByText: (text: string | RegExp) => any;
    getAllByText: (text: string | RegExp) => any[];
    queryByText: (text: string | RegExp) => any | null;
    queryAllByText: (text: string | RegExp) => any[];
    getByPlaceholderText: (placeholder: string | RegExp) => any;
    getAllByPlaceholderText: (placeholder: string | RegExp) => any[];
    queryByPlaceholderText: (placeholder: string | RegExp) => any | null;
    queryAllByPlaceholderText: (placeholder: string | RegExp) => any[];
    getByDisplayValue: (value: string | RegExp) => any;
    getAllByDisplayValue: (value: string | RegExp) => any[];
    queryByDisplayValue: (value: string | RegExp) => any | null;
    queryAllByDisplayValue: (value: string | RegExp) => any[];
    getByLabelText: (text: string | RegExp) => any;
    getAllByLabelText: (text: string | RegExp) => any[];
    queryByLabelText: (text: string | RegExp) => any | null;
    queryAllByLabelText: (text: string | RegExp) => any[];
    findByTestId: (id: string | RegExp) => Promise<any>;
    findAllByTestId: (id: string | RegExp) => Promise<any[]>;
    findByText: (text: string | RegExp) => Promise<any>;
    findAllByText: (text: string | RegExp) => Promise<any[]>;
    findByPlaceholderText: (placeholder: string | RegExp) => Promise<any>;
    findAllByPlaceholderText: (placeholder: string | RegExp) => Promise<any[]>;
    findByDisplayValue: (value: string | RegExp) => Promise<any>;
    findAllByDisplayValue: (value: string | RegExp) => Promise<any[]>;
    findByLabelText: (text: string | RegExp) => Promise<any>;
    findAllByLabelText: (text: string | RegExp) => Promise<any[]>;
    update: (element: ReactElement) => void;
    rerender: (element: ReactElement) => void;
    unmount: () => void;
    debug: (message?: string) => void;
    asJSON: () => any;
    toJSON: () => any;
    UNSAFE_getByProps: (props: Record<string, any>) => any;
    UNSAFE_getAllByProps: (props: Record<string, any>) => any[];
    UNSAFE_queryByProps: (props: Record<string, any>) => any | null;
    UNSAFE_queryAllByProps: (props: Record<string, any>) => any[];
    UNSAFE_getByType: (type: React.ComponentType<any>) => any;
    UNSAFE_getAllByType: (type: React.ComponentType<any>) => any[];
    UNSAFE_queryByType: (type: React.ComponentType<any>) => any | null;
    UNSAFE_queryAllByType: (type: React.ComponentType<any>) => any[];
    UNSAFE_root: any;
  }

  export function render(
    component: ReactElement,
    options?: RenderOptions
  ): RenderAPI;

  export const fireEvent: {
    (element: any, eventName: string, eventProperties?: any): void;
    press: (element: any) => void;
    changeText: (element: any, text: string) => void;
    scroll: (element: any, options: { nativeEvent: any }) => void;
    focus: (element: any) => void;
    blur: (element: any) => void;
  };

  export function waitFor<T = any>(
    callback: () => T | Promise<T>,
    options?: { timeout?: number; interval?: number }
  ): Promise<T>;

  export function waitForElementToBeRemoved<T = any>(
    callback: () => T | Promise<T>,
    options?: { timeout?: number; interval?: number }
  ): Promise<T>;

  export const screen: RenderAPI;

  export function cleanup(): void;
}
