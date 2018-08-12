
import './modal.scss';

import React from 'react';

import utils from 'utils';


const ANIMATION_TIME = 200;

class Modal extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['checkLongModal', 'toggleOutsideFocus']);
		this.state = {
			longModal: false,
			show: this.props.show,
			animate: false,
			leftPos: undefined,
			topPos: undefined,
		};
	}

	componentDidMount() {
		window.addEventListener('resize', this.checkLongModal);
	}

	componentWillReceiveProps(nextProps) {
		const {show, system, dispatch} = nextProps;

		if (show === this.props.show) {
			return;
		}
		dispatch && dispatch(show ? 'pauseGame' : 'unpauseGame', true);
		if (show) {
			document.body.className += ' modal-open';
			this.lastActiveElem = document.activeElement;
			this.setState({show: true, animate: true}, () => {
				this.toggleOutsideFocus(true);
				this.animTimer = setTimeout(() => {
					this.setState({animate: false});
				}, 0);
			});
		} else {
			document.body.className = document.body.className.replace(' modal-open', '');
			this.setState({animate: true}, () => {
				this.animTimer = setTimeout(() => {
					this.toggleOutsideFocus(false);
					this.setState({show: false, animate: false});
				}, ANIMATION_TIME);
			});
		}
	}

	componentDidUpdate() {
		if (this.refs.modal && (!this.props.pos ? this.oldModalHeight !== this.refs.modal.clientHeight : this.props.pos !== this.oldPos)) {
			this.checkLongModal(true);
		}
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.checkLongModal);
		clearTimeout(this.longTimer);
		clearTimeout(this.animTimer);
	}

	checkLongModal(instant) {
		const setLong = () => {
			if (this.refs.modal) {
				const {clientHeight, clientWidth} = this.refs.modal;

				if (!this.props.pos) {
					this.setState({longModal: clientHeight > window.innerHeight - 50});
					this.oldModalHeight = clientHeight;
				} else {
					const topPos = this.props.pos.top + clientHeight + 20 > window.innerHeight ? this.props.pos.bottom - clientHeight + 10 : this.props.pos.top - 10;
					const leftPos = this.props.pos.right + clientWidth + 20 > window.innerWidth ? this.props.pos.left - clientWidth - 10 : this.props.pos.right + 10;

					this.setState({topPos: topPos + 'px', leftPos: leftPos + 'px'});
					this.oldPos = this.props.pos;
				}
			}
		};

		clearTimeout(this.longTimer);
		this.longTimer = typeof instant !== 'boolean' || !instant ? setTimeout(setLong, 300) : setLong();
	}

	toggleOutsideFocus(isDisable) {
		const focusableQuery = `
				button:not(:disabled), [href]:not(:disabled),
				input:not(:disabled), select:not(:disabled),
				textarea:not(:disabled), [tabindex]:not([tabindex="-1"]):not([data-old-tab-index])
			`;
		const allFocusables = Array.from(document.body.querySelectorAll(focusableQuery));
		const modalFocusables = Array.from(this.refs.modal.querySelectorAll(focusableQuery));
		const focusElem = isDisable ? modalFocusables[0] : this.lastActiveElem;

		allFocusables.forEach(elem => {
			if (modalFocusables.indexOf(elem) > -1) {
				return;
			}
			if (isDisable) {
				if (typeof elem.tabIndex !== 'undefined') {
					elem.dataset.oldTabIndex = elem.tabIndex;
				}
				elem.tabIndex = -1;
			} else {
				if (typeof elem.dataset.oldTabIndex !== 'undefined') {
					elem.tabIndex = elem.dataset.oldTabIndex;
					delete elem.dataset.oldTabIndex;
				} else {
					elem.removeAttribute('tabIndex');
				}
			}
		});
		focusElem && focusElem.focus();
	}

	render() {
		if (!this.state.show) {
			return null;
		}

		const children = this.props.children.length ? this.props.children : [this.props.children];
		const headerChildren = [];
		const contentChildren =[];
		const footerChildren = [];

		children.forEach(child => {
			if (!child) {
				return;
			}
			if (child.props['data-modal-head']) {
				headerChildren.push(child);
			} else if (child.props['data-modal-foot']) {
				footerChildren.push(child);
			} else {
				contentChildren.push(child);
			}
		});

		return (
			<div onClick={!this.props.locked && this.props.onClose} className={utils.getClassName({
				'modal-backdrop': true,
				'transparent-backdrop': this.props.pos,
				locked: this.props.locked,
				long: this.state.longModal,
				open: this.props.show,
				closed: !this.props.show,
				animate: this.state.animate,
				[this.props.size]: this.props.size,
				[this.props.className]: this.props.className,
			})}>
				<div className="modal-box" ref="modal"
					onClick={e => e.stopPropagation()}
					style={{left: this.state.leftPos, top: this.state.topPos}}>
					<div className="inner">
						{!this.props.locked &&
							<button onClick={this.props.onClose} className="icon button close-button">
								<div className="access">Close modal</div>
								<i>close</i>
							</button>
						}
						{headerChildren.length > 0 &&
							<div className="head">
								{headerChildren}
							</div>
						}
						{contentChildren.length > 0 &&
							<div className="body">
								{contentChildren}
							</div>
						}
						{footerChildren.length > 0 &&
							<div className="foot">
								{footerChildren}
							</div>
						}
						{this.props.loading &&
							<div className="disabled-overlay"><span>Loading...</span></div>
						}
					</div>
				</div>
			</div>
		);
	}
}

export default Modal;
