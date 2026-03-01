declare module 'react-plotly.js' {
  import { Component } from 'react';

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
  }

  class Plot extends Component<PlotParams> {}
  export default Plot;
}

declare namespace Plotly {
  interface Data {
    x?: (number | string)[];
    y?: (number | string)[];
    type?: string;
    mode?: string;
    marker?: { color?: string; size?: number };
    line?: { color?: string; width?: number };
    name?: string;
    [key: string]: any;
  }

  interface Layout {
    title?: string | { text: string; font?: { size: number } };
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    font?: { color?: string; size?: number };
    margin?: { t?: number; r?: number; b?: number; l?: number };
    xaxis?: AxisLayout;
    yaxis?: AxisLayout;
    hovermode?: string;
    dragmode?: string;
    [key: string]: any;
  }

  interface AxisLayout {
    title?: string | { text: string };
    gridcolor?: string;
    zerolinecolor?: string;
    exponentformat?: string;
    type?: string;
    [key: string]: any;
  }

  interface Config {
    displayModeBar?: boolean;
    scrollZoom?: boolean;
    toImageButtonOptions?: {
      format?: string;
      scale?: number;
      filename?: string;
    };
    responsive?: boolean;
    [key: string]: any;
  }
}
