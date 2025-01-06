import React from "react";

interface Props {
  children: React.ReactNode;
}

export default class Viewport extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <div className="viewport" id="viewport">
        {this.props.children}
      </div>
    );
  }
}
