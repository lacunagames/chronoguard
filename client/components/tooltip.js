
import './tooltip.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import utils from 'utils';

const ANIMATION_TIME = 200;
const SPACING = 8;

class Tooltip extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['updatePosition', 'toggleOnEvent', 'getTrigger']);

		this.debounceUpdatePosition = utils.debounce(this.updatePosition, 250);
		this.state = {
			show: this.props.show,
			animate: false,
			wrap: undefined,
		};

	}

	toggleOnEvent(e) {
		const isEnter = e.type === 'mouseenter' || e.type === 'focus';
		const delay = isEnter ? 500 : 250;

		// Don't toggle when focused by JS triggered event (eg. modal close)
		if (!e.relatedTarget) {
			return;
		}

		clearTimeout(this.hideTimer);
		this.mouseEntered = isEnter;
		this.holdTimer = setTimeout(() => this.mouseEntered === isEnter && this.props.toggleTooltip(isEnter), delay);
	}

	componentDidMount() {
		if (!document.querySelector('.tooltip-container')) {
			console.warn('Tooltip error: Tooltip container not found.');
		} else {
			const wrap = document.createElement('div');
			document.querySelector('.tooltip-container').appendChild(wrap);
			this.setState({wrap});
		}
		utils.onEvent(window, 'resize', this.debounceUpdatePosition);
		utils.onEvent(this.getTrigger(), 'mouseenter focus mouseleave blur', this.toggleOnEvent);
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.show === nextProps.show) {
			return;
		}

		clearTimeout(this.animTimer);
		this.setState({show: true, animate: true}, () => {
			this.animTimer = setTimeout(() => {
				this.setState({show: nextProps.show, animate: false});
			}, nextProps.show ? 0 : ANIMATION_TIME);
		});
	}

	componentDidUpdate(prevProps) {
		if (this.props.show !== prevProps.show) {
			this.updatePosition();
		}
	}

	componentWillUnmount() {
		utils.offEvent(window, 'resize', this.debounceUpdatePosition);
		utils.offEvent(this.getTrigger(), 'mouseenter focus mouseleave blur', this.toggleOnEvent);
		clearTimeout(this.holdTimer);
		clearTimeout(this.animTimer);
		this.debounceUpdatePosition.clear();
		this.state.wrap && document.querySelector('.tooltip-container').removeChild(this.state.wrap);
	}

	updatePosition() {
		if (!this.state.show) {
			return;
		}

		const triggerRectOrig = this.getTrigger().getBoundingClientRect();
		const triggerRect = {
			left: triggerRectOrig.left + document.documentElement.scrollLeft,
			right: triggerRectOrig.right +  document.documentElement.scrollLeft,
			top: triggerRectOrig.top +  document.documentElement.scrollTop,
			bottom: triggerRectOrig.bottom +  document.documentElement.scrollTop,
			width: triggerRectOrig.width,
			height: triggerRectOrig.height,
		};
		const tooltipRect = this.refs.tooltip.getBoundingClientRect();
		const containerRect = document.querySelector('.tooltip-container').getBoundingClientRect();
		const fitsRight = triggerRect.right + SPACING + tooltipRect.width < containerRect.right;
		const fitsBottom = triggerRect.top + SPACING + tooltipRect.height < containerRect.bottom;

		this.refs.tooltip.style.left = fitsRight ? `${triggerRect.right + SPACING}px` : `${triggerRect.left - SPACING -  tooltipRect.width}px`;
		this.refs.tooltip.style.top = fitsBottom ? `${triggerRect.top + SPACING}px` : `${triggerRect.bottom - SPACING - tooltipRect.height}px`;
	}

	getTrigger() {
		// findDOMNode returns the first element of current component as wrapper is a React.Fragment
		return ReactDOM.findDOMNode(this);
	}

	render() {
		const children = React.Children.toArray(this.props.children);
		const trigger = children.find(el => el.props['data-tooltip-trigger']) || children[0];
		let contentChildren = children.filter(el => el !== trigger);

		// Still render last tooltip content when playing close animation
		if (contentChildren.length === 0) {
			contentChildren = this.lastContentChildren;
		} else {
			this.lastContentChildren = contentChildren;
		}

		return (
			<React.Fragment>
				{trigger}
				{this.state.show && this.state.wrap && ReactDOM.createPortal(
					<div className={utils.getClassName({
							tooltip: true,
							open: this.props.show,
							closed: !this.props.show,
							animate: this.state.animate,
						})}
						onMouseEnter={this.toggleOnEvent}
						onMouseLeave={this.toggleOnEvent}
						ref="tooltip"
						{...this.props}>
						{contentChildren}
					</div>,
					this.state.wrap)}
			</React.Fragment>
		);
	}
}

export default Tooltip;
