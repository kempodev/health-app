import type React from 'react';

export const LineChart = ({
  children,
  data,
}: {
  children: React.ReactNode;
  data: any[];
}) => {
  return <div>{children}</div>;
};

export const Line = ({
  type,
  dataKey,
  stroke,
}: {
  type: string;
  dataKey: string;
  stroke: string;
}) => {
  return null;
};

export const XAxis = ({ dataKey }: { dataKey: string }) => {
  return null;
};

export const YAxis = () => {
  return null;
};

export const CartesianGrid = ({
  strokeDasharray,
}: {
  strokeDasharray: string;
}) => {
  return null;
};

export const Tooltip = () => {
  return null;
};

export const ResponsiveContainer = ({
  children,
  width,
  height,
}: {
  children: React.ReactNode;
  width: string | number;
  height: string | number;
}) => {
  return <div style={{ width: width, height: height }}>{children}</div>;
};

