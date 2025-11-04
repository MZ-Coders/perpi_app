import React from 'react';
import { View, ViewProps } from 'react-native';

type SharedElementProps = ViewProps & {
  id?: string;
  onNode?: () => void;
};

// No-op shim for SharedElement on all platforms. It simply renders children.
export default function SharedElement({ children, style }: React.PropsWithChildren<SharedElementProps>) {
  return <View style={style}>{children}</View>;
}
