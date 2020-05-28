import React, { Component } from "react";
import { connect } from "react-redux";

const mapStateToProps = state => {
  return { UI: state.UI };
};

class Dialpad extends Component {
  
  render() {
    return (
      <div
        id="dialpad"
        className="container-fluid"
        style={{ display: this.props.UI.dialPadShow ? "block" : "none" }}
      >
        <div className="row dial-pad-row">
          <div id="key1" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">1</div>
              <div className="row alpha justify-content-center"></div>
            </div>
          </div>
          <div id="key2" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">2</div>
              <div className="row alpha justify-content-center">ABC</div>
            </div>
          </div>
          <div id="key3" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">3</div>
              <div className="row alpha justify-content-center">DEF</div>
            </div>
          </div>
        </div>
        <div className="row dial-pad-row">
          <div id="key4" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">4</div>
              <div className="row alpha justify-content-center">GHU</div>
            </div>
          </div>
          <div id="key5" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">5</div>
              <div className="row alpha justify-content-center">JKL</div>
            </div>
          </div>
          <div id="key6" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">6</div>
              <div className="row alpha justify-content-center">MNO</div>
            </div>
          </div>
        </div>
        <div className="row dial-pad-row">
          <div id="key7" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">7</div>
              <div className="row alpha justify-content-center">PQRS</div>
            </div>
          </div>
          <div id="key8" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">8</div>
              <div className="row alpha justify-content-center">TUV</div>
            </div>
          </div>
          <div id="key9" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">9</div>
              <div className="row alpha justify-content-center">WXYZ</div>
            </div>
          </div>
        </div>
        <div className="row dial-pad-row">
          <div id="keystar" className="col key">
            <div className="center">
              <div
                className="row digit justify-content-center"
                style={{ fontSize: "2.0rem" }}
              >
                *
              </div>
            </div>
          </div>
          <div id="key0" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">0</div>
            </div>
          </div>
          <div id="keyhash" className="col key">
            <div className="center">
              <div className="row digit justify-content-center">#</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Dialpad);
