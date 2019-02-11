const e = React.createElement;

class UpdateLog extends React.Component {

    constructor(sValue){
        super(sValue);
        this.state = {
            value: 0,
            items: [
                (
                    <p>
                        <h3>The Re-factory Update 0.8</h3>
                        <ul>
                            <li>Added buildings that can be built using droids you have</li>
                            <li>Droids can see only the specified range of the map</li>
                            <li>HIgh score tables</li>
                            <li>Even more bugs</li>
                        </ul>
                    </p>
                ),
                (
                    <p>
                        <h3>Update 0.7</h3>
                        <ul>
                            <li>Some effects</li>
                            <li>Bug fixes</li>
                            <li>Some optimizations</li>
                        </ul>
                    </p>
                ),
                (
                    <p>
                        <h3>Update 0.6</h3>
                        <ul>
                            <li>Added register option</li>
                            <li>Added /msg command</li>
                            <li>Added update log (you just read this)</li>
                        </ul>
                    </p>
                ),
            ],
        }
    }
    render() {
        return (
            <div>

                <button
                    onClick = {() => {this.setState({value: this.state.value - 1})}}
                    disabled = {this.state.value === 0}
                    style = {{float: 'left'}}
                >
                    Previous
                </button>
                <button
                    onClick = {() => {this.setState({value: this.state.value + 1})}}
                    disabled = {this.state.value === this.state.items.length - 1}
                    style = {{float: 'right'}}
                >
                    Next
                </button>
                    <h2>Update log</h2>

                {this.state.items[this.state.value]}
            </div>
        );
    }
}

const domContainer = document.querySelector('#updateLog');
ReactDOM.render(e(UpdateLog), domContainer);