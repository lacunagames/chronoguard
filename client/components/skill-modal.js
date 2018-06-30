
import './skill-modal.scss';

import React from 'react';

import Modal from './modal';
import utils from 'utils';

class SkillModal extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['updateArrows']);
		this.skillTreeRef = React.createRef();
		this.state = {
			svgWidth: 0,
			svgHeight: 0,
		};
		this.debounceUpdateArrow = utils.debounce(this.updateArrows, 500, () => this.setState({svgWidth: 0, svgHeight: 0}));
	}

	componentDidMount() {
		this.updateArrows();
		utils.onEvent(window, 'resize', this.debounceUpdateArrow);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.show && !this.props.show) {
			setTimeout(this.updateArrows, 0);
		}
	}

	componentWillUnmount() {
		this.debounceUpdateArrow.clear();
		utils.offEvent(window, 'resize', this.debounceUpdateArrow);
	}

	updateArrows() {
		this.setState({
			svgWidth: this.skillTreeRef.current ? this.skillTreeRef.current.clientWidth : 0,
			svgHeight: this.skillTreeRef.current ? this.skillTreeRef.current.clientHeight : 0,
		});
	}

	skillClick(e, skillId) {
		e.preventDefault();
		this.props.dispatch('learnSkill', skillId);
	}

	renderArrows(skills) {
		const colors = {active: '#666', learnt: '#0eb00e', inactive: '#aaa'};
		const {svgWidth, svgHeight} = this.state;
		const offsets = {left: [-7, 28], right: [57, 28], top: [28, -5], bottom: [28, 60]};
		const directions = [
				[{from: 'bottom', to: 'top'}, {from: 'top', to: 'bottom'}],
				[{from: 'right', to: 'left'}, {from: 'left', to: 'right'}],
			];

		if (svgWidth === 0) {
			return null;
		}

		const paths = [];

		skills.forEach(skill => {
			const isLearnt = this.props.player.learntSkills.find(name => skill.id === name);

			skill.requires && skill.requires.forEach(name => {
				const fromSkill = this.props.player.skills.find(skill => skill.id === name);
				const isActive = this.props.player.learntSkills.find(learntName => learntName === name);
				const type = isLearnt ? 'learnt' : isActive ? 'active' : 'inactive';
				const pos = {
					fromX: fromSkill.treeX * svgWidth / 100, fromY: fromSkill.treeY * svgHeight / 100,
					toX: skill.treeX * svgWidth / 100, toY: skill.treeY * svgHeight / 100,
				};
				const isVertical = Math.abs(pos.toX - pos.fromX) >= Math.abs(pos.toY - pos.fromY);
				const isNegative = isVertical ? pos.toX < pos.fromX : pos.toY < pos.fromY;
				const fromOffset = offsets[directions[+isVertical][+isNegative].from];
				const toOffset = offsets[directions[+isVertical][+isNegative].to];

				paths.push((
						<path className="arrow-line"
							style={{'marker-end': `url(#head-${type})`}}
							stroke-width="6" fill="none" stroke={colors[type]}
							d={`M${pos.fromX + fromOffset[0]},${pos.fromY + fromOffset[1]}
								L${pos.toX + toOffset[0]},${pos.toY + toOffset[1]}`} />
					));
			});
		});

		return (
		<svg className="arrows" width={svgWidth} height={svgHeight}>
			<defs>
				<marker id="head-inactive" orient="auto" markerWidth="4" markerHeight="6"
								refX="1" refY="3">
					<path d="M0,2 V4 L2,3 Z" fill={colors.inactive} />
				</marker>
				<marker id="head-active" orient="auto" markerWidth="4" markerHeight="6"
								refX="1" refY="3">
					<path d="M0,2 V4 L2,3 Z" fill={colors.active} />
				</marker>
				<marker id="head-learnt" orient="auto" markerWidth="4" markerHeight="6"
								refX="1" refY="3">
					<path d="M0,2 V4 L2,3 Z" fill={colors.learnt} />
				</marker>
			</defs>
			{paths}
		</svg>
		);
	}

	render() {
		const {world, player, system, dispatch} = this.props;
		const skills = player.skills.map(skill => (
			<li style={{left: `${skill.treeX}%`, top: `${skill.treeY}%`}}
				className={utils.getClassName({
					learnt: player.learntSkills.indexOf(skill.id) > -1,
					inactive: skill.requires && skill.requires.some(skillName => player.learntSkills.indexOf(skillName) === -1),
					'no-skill-points': skill.skillPoints > player.skillPoints,
				})}>
				<a href="#" draggable="false"
					onClick={(e) => this.skillClick(e, skill.id)}>
					<span style={{'background-image': `url(static/images/icon-${skill.icon}.jpg)`}} />
				</a>
			</li>
		));

		return (
			<Modal show={this.props.show} locked={false} onClose={this.props.onClose} size="full" {...{dispatch}}>
				<h2 data-modal-head>Skills</h2>
				<div className="skill-tree" ref={this.skillTreeRef}>
					{this.renderArrows(player.skills)}
					<ul>{skills}</ul>
				</div>
			</Modal>
		);
	}
}

export default SkillModal;
