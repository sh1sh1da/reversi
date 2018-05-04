import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

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

class Game extends React.Component {
  constructor() {
    super();
    this.state = {
      history: [{
        squares: Array.from(new Array(BOARD_HEIGHT), () => new Array(BOARD_WIDTH).fill(null))
      }],
      stepNumber: 0,
      blackIsNext: true,
    };
    this.state.history[0].squares[3][3] = '○';
    this.state.history[0].squares[3][4] = '●';
    this.state.history[0].squares[4][3] = '●';
    this.state.history[0].squares[4][4] = '○';
  }

  handleClick(x, y) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = Array.from(new Array(BOARD_HEIGHT), () => new Array(BOARD_WIDTH).fill(null));
    for (let y = 0; y < squares.length; y++) {
      for (let x = 0; x < squares[y].length; x++) {
        squares[y][x] = current.squares[y][x];
      }
    }

    if (squares[y][x]) {
      return;
    }
    squares[y][x] = this.state.blackIsNext ? '●' : '○';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      blackIsNext: !this.state.blackIsNext,
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      blackIsNext: (step % 2) === 0,
    })
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      const desc = move ?
        'Move #' + move :
        'Game start';
      return (
        <li key={move}>
          <a href="#" onClick={() => this.jumpTo(move)}>{desc}</a>
        </li>
      );
    });

    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = 'Next player: ' + (this.state.blackIsNext ? '●' : '○');
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(x, y) => this.handleClick(x, y)} />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function calculateWinner(squares) {
  return;
}
