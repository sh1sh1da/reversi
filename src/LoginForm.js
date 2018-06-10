import React from 'react';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  render() {
    const divStyle = {
      marginBottom: '10px',
    };
    return (
      <div style={divStyle}>
        <form onSubmit={e => { this.props.onClick(e, this.state.value) }}>
          <input type="text" value={this.state.value} onChange={e => { this.handleChange(e) }} />
          <input type="submit" value="login" />
        </form>
      </div>
    );
  }
}

export default LoginForm
