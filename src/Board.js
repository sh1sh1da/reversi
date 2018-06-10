import React from 'react';
import Square from './Square';

class Board extends React.Component {
  renderSquare(x, y) {
    return (
      <Square
        value={this.props.squares[y][x]}
        onClick={() => this.props.onClick(x, y)}
      />
    );
  }

  renderLine(y) {
    const rows = [];
    for (let x = 0; x < this.props.squares[y].length; x++) {
      rows.push(<span>{this.renderSquare(x, y)}</span>);
    }
    return (
      <div className="board-row">
        {rows}
      </div>
    )
  }

  render() {
    const lines = []
    for (let y = 0; y < this.props.squares.length; y++) {
      lines.push(<div>{this.renderLine(y)}</div>);
    }

    return (
      <div>
        {lines}
      </div>
    );
  }
}

export default Board
