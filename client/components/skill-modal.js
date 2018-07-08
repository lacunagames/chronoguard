
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
		const offset = 27; // Half of skill box width
		const colors = {active: '#cece5e', learnt: '#43b200', inactive: '#adac8b'};
		const {svgWidth, svgHeight} = this.state;

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
					fromX: fromSkill.treeX * svgWidth / 100 + offset, fromY: fromSkill.treeY * svgHeight / 100 + offset,
					toX: skill.treeX * svgWidth / 100 + offset, toY: skill.treeY * svgHeight / 100 + offset,
				};
				const angle = Math.atan2(pos.toY - pos.fromY, pos.toX - pos.fromX);
				const distance = offset / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))) + 4;
				const offPos = {
					fromX: distance * Math.cos(angle), fromY: distance * Math.sin(angle),
					toX: (distance + 5) * Math.cos(angle - Math.PI), toY: (distance + 5) * Math.sin(angle - Math.PI),
				};

				paths.push((
						<path className="arrow-line"
							style={{'marker-end': `url(#head-${type})`}}
							stroke-width="4" fill="none" stroke={colors[type]}
							d={`M${pos.fromX + offPos.fromX},${pos.fromY + offPos.fromY}
								L${pos.toX + offPos.toX},${pos.toY + offPos.toY}`} />
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
