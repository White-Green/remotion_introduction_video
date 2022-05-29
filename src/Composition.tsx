import "react";
import { AbsoluteFill, Audio, Easing, IFrame, Img, Loop, Sequence, Series } from "remotion";
import fee_layers from "./CharacterImage/fee_layers";
import { WAV_LENGTH, WAV_VALUES } from "../voices/voices";
import voiceInfo from "../voices/voices.json";
import { loadDefaultJapaneseParser } from 'budoux';
import React from "react";
import { useCurrentFrame } from "remotion";
import { interpolate } from "remotion";
import 'katex/dist/katex.min.css';
import 'highlightjs/styles/monokai-sublime.css';
import TeX from '@matejmazur/react-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styled from 'styled-components';
import bgm from '../素材/nc184855.mp3';

const IsPreview = process.env.NODE_ENV === "development";

const parser = loadDefaultJapaneseParser();

export const BudouXText: React.FC<{ text: string }> = ({ text }) => {
	const result = React.useMemo(() => parser.parse(text).map((s) => (<span style={{ display: "inline-block" }}>{s}</span>)), [text]);
	return <>
		{result}
	</>
}

const Fee: React.FC<JSX.IntrinsicElements["img"] & { lswitch?: (typeof fee_layers)[number][], flip_x?: boolean, flip_y?: boolean }> = (props) => {
	const { lswitch = [] as string[], flip_x = false, flip_y = false } = props as { lswitch?: string[], flip_x?: boolean, flip_y?: boolean };
	const layer = lswitch.map(layer => { return { type: "layer", path: layer } });
	return <Img src={`http://localhost:8080/image/fee?settings=${encodeURI(JSON.stringify(layer))}&flip_x=${flip_x}&flip_y=${flip_y}&sequence=${useCurrentFrame()}`} {...props} />;
};

const SubtitleBackground: React.FC = () => {
	const width = 1920;
	const height = 1080;
	const margin = 10;
	const radius = 40;
	const rect_height = 260;
	return <svg width={width} height={height} style={{ position: "absolute" }}>
		<path strokeWidth={margin} stroke="#202020" fill="#ffffff7f" d={`M${radius + margin} ${height - margin} a ${radius} ${radius} 0 0 1 ${-radius} ${-radius} v -${rect_height - 2 * radius} a ${radius} ${radius} 0 0 1 ${radius} ${-radius} H 1300 L 1600 500 L 1400 ${height - margin - rect_height / 2} V ${height - margin - radius} a ${radius} ${radius} 0 0 1 ${-radius} ${radius} z`} />
	</svg>;
};

const FadeinText: React.FC<{ text: string, from?: number, speed?: number }> = ({ text, from = 0, speed = 1, }) => {
	const frame = useCurrentFrame() - from;
	return <>
		{text.slice(0, Math.max(Math.floor(frame / 6 * speed), 0))}
	</>
};

const Header1 = styled.div`
	font-size: 80px;
`;

const Header2 = styled.div`
	font-size: 60px;
	margin-left: 20px;
`;

const Header3 = styled.div`
	font-size: 50px;
	margin-left: 40px;
`;

const PhonemeToLayer: ((p: string) => (typeof fee_layers)[number] | undefined) = (p: string) => {
	switch (p) {
		case "a":
		case "A":
			return "フィーちゃん立ち絵/!表情/!口/*笑顔";
		case "i":
		case "I":
			return "フィーちゃん立ち絵/!表情/!口/*い";
		case "u":
		case "U":
			return "フィーちゃん立ち絵/!表情/!口/*う";
		case "e":
		case "E":
			return "フィーちゃん立ち絵/!表情/!口/*はにかみ";
		case "o":
		case "O":
			return "フィーちゃん立ち絵/!表情/!口/*お";
	}
	return undefined;
};

const PhonemeListToLayer: ((p0?: string, p1?: string, p2?: string) => (typeof fee_layers)[number]) = (p0, p1, p2) => {
	if (!p1) return "フィーちゃん立ち絵/!表情/!口/*ほほえみ";
	const current = PhonemeToLayer(p1);
	if (current) return current;
	switch (p1) {
		case "sil":
		case "pau":
		case "N":
			return "フィーちゃん立ち絵/!表情/!口/*ほほえみ";
		case "cl":
			return PhonemeToLayer(p0!)!;
		default:
			return PhonemeToLayer(p2!)!;
	}
};

const SequenceLength = WAV_LENGTH.map(len => Math.round((len + .5) * 60));

const Base: React.FC<{ n: number, lswitch?: (typeof fee_layers)[number][], children?: React.ReactNode }> = ({ n, lswitch = [], children = <></> }) => {
	const frame = useCurrentFrame();
	const subtitle_size = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
	const script = (IsPreview ? `${n}: ` : "") + voiceInfo[n].script;
	const lab_frame = (frame - 10) / 60 * 1e7;
	const index = voiceInfo[n].lab.findIndex(lab => lab.begin > lab_frame);
	const mouse = PhonemeListToLayer(voiceInfo[n].lab[index - 2]?.phoneme, voiceInfo[n].lab[index - 1]?.phoneme, voiceInfo[n].lab[index]?.phoneme);
	if (!mouse) throw new Error();
	return <AbsoluteFill style={{ background: "mediumseagreen" }}>
		<div style={{ position: "absolute", background: "darkgreen", border: "solid 10px saddlebrown", borderBottom: "solid 20px saddlebrown", borderRadius: 10, width: 1500, height: 800, padding: 10, color: "floralwhite", fontFamily: "Meiryo" }}>
			{children}
		</div>
		<Fee lswitch={["エフェクト(素材として利用可)/メロンパン", "フィーちゃん立ち絵/!髪飾り/アホ毛", mouse, ...lswitch]} style={{ position: "absolute", right: -250, transformOrigin: "top", transform: "scale(1.1)", filter: "drop-shadow(15px 15px 5px #202020)" }} />
		<Sequence from={10}>
			<Audio src={WAV_VALUES[n]} />
		</Sequence>
		<AbsoluteFill style={{ transformOrigin: "1600px 500px", transform: `matrix(${(subtitle_size + 1) / 2}, ${9 * (subtitle_size - 1) / 32}, ${8 * (subtitle_size - 1) / 9}, ${(subtitle_size + 1) / 2}, 0, 0)` }}>
			<SubtitleBackground />
			<div style={{ position: "absolute", left: 30, bottom: 30, height: 220, width: 1350, fontSize: 43, fontFamily: "UD デジタル 教科書体 NK-R" }}>
				<AbsoluteFill style={{ display: "block", WebkitTextStroke: 4, color: "whitesmoke" }}>
					<BudouXText text={script} />
				</AbsoluteFill>
				<AbsoluteFill style={{ display: "block", color: "hotpink" }}>
					<BudouXText text={script} />
				</AbsoluteFill>
			</div>
		</AbsoluteFill>
	</AbsoluteFill>;
}

const FakeVideo: React.FC<{ x: number, y: number, color1: string, color2: string }> = ({ x, y, color1, color2 }) => {
	return <div style={{ gridRow: `${y + 2} / ${y + 3}`, gridColumn: `${x + 1} / ${x + 2}`, border: "solid 1px darkgray", borderRadius: 5, margin: 10, marginTop: 0 }}>
		<div style={{ width: "100%", aspectRatio: "16 / 9", background: `linear-gradient(to bottom right, ${color1}, ${color2})`, clipPath: "polygon(5px 5px, calc(100% - 5px) 5px, calc(100% - 5px) calc(100% - 5px), 5px calc(100% - 5px))" }} >
		</div>
		<span style={{ margin: 5 }}>{new Array(10).fill("●").join("")}</span>
	</div>;
}

const Page: React.FC = () => {
	return <>
		<div style={{
			fontSize: 20,
			gridRow: "1 / 2",
			gridColumn: "1 / 4"
		}}>nic●nic●</div>
		<FakeVideo x={0} y={0} color1={"blue"} color2={"pink"} />
		<FakeVideo x={0} y={1} color1={"blue"} color2={"pink"} />
		<FakeVideo x={0} y={2} color1={"blue"} color2={"pink"} />
		<FakeVideo x={0} y={3} color1={"blue"} color2={"pink"} />
		<FakeVideo x={0} y={4} color1={"blue"} color2={"pink"} />

		<FakeVideo x={1} y={0} color1={"red"} color2={"lime"} />
		<FakeVideo x={1} y={1} color1={"red"} color2={"lime"} />
		<FakeVideo x={1} y={2} color1={"red"} color2={"lime"} />
		<FakeVideo x={1} y={3} color1={"red"} color2={"lime"} />
		<FakeVideo x={1} y={4} color1={"red"} color2={"lime"} />

		<FakeVideo x={2} y={0} color1={"white"} color2={"purple"} />
		<FakeVideo x={2} y={1} color1={"white"} color2={"purple"} />
		<FakeVideo x={2} y={2} color1={"white"} color2={"purple"} />
		<FakeVideo x={2} y={3} color1={"white"} color2={"purple"} />
		<FakeVideo x={2} y={4} color1={"white"} color2={"purple"} />
	</>;
};

export const Thumbnail: React.FC = () => {
	const pos_x: ((x: number) => number) = (x) => x + 3;
	const pos_y: ((y: number) => number) = (y) => 8 - (y + 2);
	const f: (x: number) => number = (x) => 0.0000002 * (x + 2) * (x + 0.5) * (x - 3) * Math.pow(x - 15, 5);
	const chalk_color = "floralwhite";
	const line_width = 0.05;
	return <>
		<AbsoluteFill style={{ background: "mediumseagreen" }}>
			<div style={{ position: "absolute", background: "darkgreen", border: "solid 20px saddlebrown", borderBottom: "solid 40px saddlebrown", borderRadius: 10, left: 0, right: 0, top: 0, bottom: 0, padding: 10, color: "floralwhite", fontFamily: "Meiryo" }} >
				<svg width={14} height={8} style={{ position: "absolute", aspectRatio: "33 / 8", top: 10, left: 10, transformOrigin: "left top", transform: "scale(125)" }}>
					<line x1={pos_x(-3)} y1={pos_y(0)} x2={pos_x(14)} y2={pos_y(0)} stroke={chalk_color} strokeWidth={line_width} />
					<line x1={pos_x(0)} y1={pos_y(-2)} x2={pos_x(0)} y2={pos_y(6)} stroke={chalk_color} strokeWidth={line_width} />
					<path d={`M ${pos_x(-3)} ${pos_y(f(-3))}` + new Array(1400).fill(null).map((_, i) => (i + 1) / 100 - 3).map(x => `L ${pos_x(x)} ${pos_y(f(x))} `).join("")} fill="none" stroke={chalk_color} strokeWidth={line_width} />
					<path d={`M ${pos_x(-2)} ${pos_y(f(-2))}` + new Array(500).fill(null).map((_, i) => (i + 1) / 100 - 2).map(x => `L ${pos_x(x)} ${pos_y(f(x))} `).join("")} fill="yellow" fillOpacity={0.5} stroke={chalk_color} strokeWidth={line_width} />
				</svg>
				<TeX math="S=\int^3_{-2}\left|f(x)\right|dx" block style={{ position: "absolute", fontSize: 90, left: 700, top: 550, filter: "drop-shadow(5px 0px darkgreen) drop-shadow(0px 5px darkgreen) drop-shadow(-5px 0px darkgreen) drop-shadow(0px -5px darkgreen)" }} />
				<div style={{ position: "absolute", WebkitTextStrokeWidth: 10, fontSize: 250, left: 100, top: 0, filter: "drop-shadow(5px 0px darkgreen) drop-shadow(0px 5px darkgreen) drop-shadow(-5px 0px darkgreen) drop-shadow(0px -5px darkgreen)" }}>グラフ</div>
				<div style={{ position: "absolute", color: "hotpink", fontSize: 250, left: 100, top: 0, }}>グラフ</div>
				<div style={{ position: "absolute", fontSize: 100, left: 400, top: 270, filter: "drop-shadow(5px 0px darkgreen) drop-shadow(0px 5px darkgreen) drop-shadow(-5px 0px darkgreen) drop-shadow(0px -5px darkgreen)" }}>と</div>
				<div style={{ position: "absolute", WebkitTextStrokeWidth: 10, fontSize: 250, left: 200, top: 350, filter: "drop-shadow(5px 0px darkgreen) drop-shadow(0px 5px darkgreen) drop-shadow(-5px 0px darkgreen) drop-shadow(0px -5px darkgreen)" }}>数式</div>
				<div style={{ position: "absolute", color: "deepskyblue", fontSize: 250, left: 200, top: 350, }}>数式</div>
				<div style={{ position: "absolute", fontSize: 80, left: 810, top: 290, filter: "drop-shadow(5px 0px darkgreen) drop-shadow(0px 5px darkgreen) drop-shadow(-5px 0px darkgreen) drop-shadow(0px -5px darkgreen)" }}>の</div>
				<div style={{ position: "absolute", fontSize: 250, left: 900, top: 100, writingMode: "vertical-lr", filter: "drop-shadow(5px 0px darkgreen) drop-shadow(0px 5px darkgreen) drop-shadow(-5px 0px darkgreen) drop-shadow(0px -5px darkgreen)" }}>動画</div>
			</div>
			<Fee lswitch={["エフェクト(素材として利用可)/メロンパン", "エフェクト(素材として利用可)/キラキラ", "フィーちゃん立ち絵/!表情/!口/*笑顔", "フィーちゃん立ち絵/!体/*おまけ"]} style={{ position: "absolute", height: 1800, transform: "rotate(-29.36deg)", top: -100, right: -600, filter: "brightness(60%) contrast(120%) brightness(166.7%)" }} />
		</AbsoluteFill>
	</>;
};

export const MainLength: number = SequenceLength.slice(0, 31).reduce((a, b) => a + b) + 60;

export const Main: React.FC = () => {
	const frame = useCurrentFrame();
	const chalk_color = "floralwhite";
	return <>
		<AbsoluteFill style={{ background: "#202020" }} />
		<AbsoluteFill style={{ opacity: interpolate(frame, [MainLength - 61, MainLength - 1], [1, 0], { extrapolateLeft: "clamp" }) }}>
			<Loop durationInFrames={5765}><Audio src={bgm} volume={interpolate(frame, [0, 120, MainLength - 60, MainLength], [0, 1, 1, 0]) * 0.1} /></Loop>
			<Series>
				<Series.Sequence durationInFrames={SequenceLength[0]}>
					<Base n={0} lswitch={["フィーちゃん立ち絵/!表情/!目/*ウインク"]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[1]}>
					<Base n={1} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[2]}>
					<Base n={2} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[3]}>
					<Base n={3} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[4]}>
					<Base n={4} lswitch={["フィーちゃん立ち絵/!表情/!目/*キラーン"]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const f = (x: number) => x * x / 2;
							const pos_x = (x: number) => 1 + x;
							const pos_y = (y: number) => 13 - y;
							const pos = (x: number, y: number) => `${pos_x(x)},${pos_y(y)}`;
							const axis_fadein = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
							const arrow_fadein = interpolate(frame, [20, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							const curve_fadein = interpolate(frame, [25, 55], [0, 61], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							const dot_line_fadein = interpolate(frame, [55, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
							const delta = interpolate(frame, [60, 120], [3, 0.01], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.quad });
							const diff_a = (f(1 + delta) - f(1)) / delta;
							const diff_b = f(1) - diff_a;
							const curve = new Array(Math.round(curve_fadein)).fill(null).map((_, i) => { const x = interpolate(i, [0, 60], [-1, 5]); return pos(x, f(x)); }).join(" ");
							return <>
								<svg width={6} height={14} style={{ position: "absolute", transformOrigin: "left top", transform: "scale(50)" }}>
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(0)} x2={pos_x(-1 * (1 - axis_fadein) + 4.9 * axis_fadein)} y2={pos_y(0)} />
									<path strokeWidth={0.1} fill={chalk_color} fillOpacity={arrow_fadein} d={`M ${pos(4.8, -0.2)} L ${pos(5, 0)} L ${pos(4.8, 0.2)}`} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(0)} y1={pos_y(-1)} x2={pos_x(0)} y2={pos_y(-1 * (1 - axis_fadein) + 12.9 * axis_fadein)} />
									<path strokeWidth={0.1} fill={chalk_color} fillOpacity={arrow_fadein} d={`M ${pos(-0.2, 12.8)} L ${pos(0, 13)} L ${pos(0.2, 12.8)}`} />
									<path strokeWidth={0.1} stroke={chalk_color} fill="transparent" d={`M ${pos(-1, f(-1))} L ${curve}`} />
									<circle fill={chalk_color} fillOpacity={dot_line_fadein} cx={pos_x(1)} cy={pos_y(f(1))} r={0.15} />
									<circle fill={chalk_color} fillOpacity={dot_line_fadein} cx={pos_x(1 + delta)} cy={pos_y(f(1 + delta))} r={0.15} />
									<line strokeWidth={0.1} stroke={chalk_color} strokeOpacity={dot_line_fadein} x1={pos_x(-1)} y1={pos_y(diff_a * (-1) + diff_b)} x2={pos_x(5)} y2={pos_y(diff_a * 5 + diff_b)} />
								</svg>
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[5]}>
					<Base n={5} lswitch={["フィーちゃん立ち絵/!表情/!目/*キラーン"]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const f = (x: number) => x * x / 2;
							const pos_x = (x: number) => 1 + x;
							const pos_y = (y: number) => 13 - y;
							const pos = (x: number, y: number) => `${pos_x(x)},${pos_y(y)}`;
							const diff_a = 1;
							const diff_b = -.5;
							const curve = new Array(61).fill(null).map((_, i) => { const x = interpolate(i, [0, 60], [-1, 5]); return pos(x, f(x)); }).join(" ");
							const math_fadein = interpolate(frame, [20, 50], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							return <>
								<svg width={6} height={14} style={{ position: "absolute", transformOrigin: "left top", transform: "scale(50)" }}>
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(0)} x2={pos_x(4.9)} y2={pos_y(0)} />
									<path strokeWidth={0.1} fill={chalk_color} d={`M ${pos(4.8, -0.2)} L ${pos(5, 0)} L ${pos(4.8, 0.2)}`} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(0)} y1={pos_y(-1)} x2={pos_x(0)} y2={pos_y(12.9)} />
									<path strokeWidth={0.1} fill={chalk_color} d={`M ${pos(-0.2, 12.8)} L ${pos(0, 13)} L ${pos(0.2, 12.8)}`} />
									<path strokeWidth={0.1} stroke={chalk_color} fill="transparent" d={`M ${pos(-1, f(-1))} L ${curve}`} />
									<circle fill={chalk_color} cx={pos_x(1)} cy={pos_y(f(1))} r={0.15} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(diff_a * (-1) + diff_b)} x2={pos_x(5)} y2={pos_y(diff_a * 5 + diff_b)} />
								</svg>
								<div style={{ position: "absolute", left: 7 * 50, fontSize: 50, clipPath: `polygon(0% 0%, ${math_fadein}% 0%, ${math_fadein}% 100%, 0% 100%)` }}>
									<TeX math="\forall\varepsilon_{>0}\exists\delta_{>0};h\in\mathbb{R}" /><br />
									<TeX math="\left[0<\left|h\right|<\delta\Rightarrow\left|\frac{f(x+h)-f(x)}{h}-\frac{d}{d x}f(x)\right|<\varepsilon\right]" />
								</div>
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[6]}>
					<Base n={6} lswitch={["フィーちゃん立ち絵/!表情/!目/*＞＜", "フィーちゃん立ち絵/!体/*おまけ", "エフェクト(素材として利用可)/キラキラ"]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const f = (x: number) => x * x / 2;
							const pos_x = (x: number) => 1 + x;
							const pos_y = (y: number) => 13 - y;
							const pos = (x: number, y: number) => `${pos_x(x)},${pos_y(y)}`;
							const diff_a = 1;
							const diff_b = -.5;
							const curve = new Array(61).fill(null).map((_, i) => { const x = interpolate(i, [0, 60], [-1, 5]); return pos(x, f(x)); }).join(" ");
							return <>
								<svg width={6} height={14} style={{ position: "absolute", transformOrigin: "left top", transform: "scale(50)" }}>
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(0)} x2={pos_x(4.9)} y2={pos_y(0)} />
									<path strokeWidth={0.1} fill={chalk_color} d={`M ${pos(4.8, -0.2)} L ${pos(5, 0)} L ${pos(4.8, 0.2)}`} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(0)} y1={pos_y(-1)} x2={pos_x(0)} y2={pos_y(12.9)} />
									<path strokeWidth={0.1} fill={chalk_color} d={`M ${pos(-0.2, 12.8)} L ${pos(0, 13)} L ${pos(0.2, 12.8)}`} />
									<path strokeWidth={0.1} stroke={chalk_color} fill="transparent" d={`M ${pos(-1, f(-1))} L ${curve}`} />
									<circle fill={chalk_color} cx={pos_x(1)} cy={pos_y(f(1))} r={0.15} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(diff_a * (-1) + diff_b)} x2={pos_x(5)} y2={pos_y(diff_a * 5 + diff_b)} />
								</svg>
								<div style={{ position: "absolute", left: 7 * 50, fontSize: 50 }}>
									<TeX math="\forall\varepsilon_{>0}\exists\delta_{>0};h\in\mathbb{R}" /><br />
									<TeX math="\left[0<\left|h\right|<\delta\Rightarrow\left|\frac{f(x+h)-f(x)}{h}-\frac{d}{d x}f(x)\right|<\varepsilon\right]" />
								</div>
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[7]}>
					<Base n={7} lswitch={[]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const f = (x: number) => x * x / 2;
							const pos_x = (x: number) => 1 + x;
							const pos_y = (y: number) => 13 - y;
							const pos = (x: number, y: number) => `${pos_x(x)},${pos_y(y)}`;
							const diff_a = 1;
							const diff_b = -.5;
							const curve = new Array(61).fill(null).map((_, i) => { const x = interpolate(i, [0, 60], [-1, 5]); return pos(x, f(x)); }).join(" ");
							const fadeout = interpolate(frame, [0, 120], [1, 0], { extrapolateRight: "clamp" });
							return <>
								<svg width={6} height={14} style={{ position: "absolute", transformOrigin: "left top", transform: "scale(50)", opacity: fadeout }}>
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(0)} x2={pos_x(4.9)} y2={pos_y(0)} />
									<path strokeWidth={0.1} fill={chalk_color} d={`M ${pos(4.8, -0.2)} L ${pos(5, 0)} L ${pos(4.8, 0.2)}`} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(0)} y1={pos_y(-1)} x2={pos_x(0)} y2={pos_y(12.9)} />
									<path strokeWidth={0.1} fill={chalk_color} d={`M ${pos(-0.2, 12.8)} L ${pos(0, 13)} L ${pos(0.2, 12.8)}`} />
									<path strokeWidth={0.1} stroke={chalk_color} fill="transparent" d={`M ${pos(-1, f(-1))} L ${curve}`} />
									<circle fill={chalk_color} cx={pos_x(1)} cy={pos_y(f(1))} r={0.15} />
									<line strokeWidth={0.1} stroke={chalk_color} x1={pos_x(-1)} y1={pos_y(diff_a * (-1) + diff_b)} x2={pos_x(5)} y2={pos_y(diff_a * 5 + diff_b)} />
								</svg>
								<div style={{ position: "absolute", left: 7 * 50, fontSize: 50, opacity: fadeout }}>
									<TeX math="\forall\varepsilon_{>0}\exists\delta_{>0};h\in\mathbb{R}" /><br />
									<TeX math="\left[0<\left|h\right|<\delta\Rightarrow\left|\frac{f(x+h)-f(x)}{h}-\frac{d}{d x}f(x)\right|<\varepsilon\right]" />
								</div>
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[8]}>
					<Base n={8} lswitch={[]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const img_fade = interpolate(frame, [0, 60, SequenceLength[8] - 30, SequenceLength[8]], [0, 1, 1, 0], {});
							return <>
								<div>
									<Img src={"https://github.com/remotion-dev/logo/raw/main/socialpreview/element-0.png"} style={{ width: 1300, opacity: img_fade }} />
								</div>
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[9]}>
					<Base n={9} lswitch={[]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const iframe_fadein = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
							return <>
								<IFrame src={"https://remotion.dev"} width={1300} height={700} scrolling={"no"} style={{ background: "white", opacity: iframe_fadein }} />
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[10]}>
					<Base n={10} lswitch={[]}>
						<IFrame src={"https://remotion.dev"} width={1300} height={700} scrolling={"no"} style={{ background: "white" }} />
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[11]}>
					<Base n={11} lswitch={[]}>
						<IFrame src={"https://remotion.dev"} width={1300} height={700} scrolling={"no"} style={{ background: "white" }} />
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[12]}>
					<Base n={12} lswitch={["エフェクト(素材として利用可)/疑問符", "フィーちゃん立ち絵/!表情/!目/*すっとぼけ"]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const iframe_fadeout = interpolate(frame, [SequenceLength[12] - 60, SequenceLength[12]], [1, 0], { extrapolateLeft: "clamp", });
							return <>
								<IFrame src={"https://remotion.dev"} width={1300} height={700} scrolling={"no"} style={{ background: "white", opacity: iframe_fadeout }} />
							</>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[13]}>
					<Base n={13} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[14]}>
					<Base n={14} lswitch={[]}>
						<AbsoluteFill style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "1fr auto 1fr" }}>
							<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "1 / 2" }}></div>
							<div style={{ margin: 20, gridRow: "2 / 3", gridColumn: "2 / 3", fontSize: 50, color: "transparent" }}><TeX math="\Rightarrow" /></div>
							<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "3 / 4", display: "grid", gridTemplateColumns: "auto 1fr", gridTemplateRows: "auto auto 1fr", background: "darkgray", borderRadius: 10 }}>
								<div style={{ margin: 10, gridRow: "1 / 2", gridColumn: "1 / 2", background: "gray", width: 150, height: 30 }}></div>
								<div style={{ margin: 10, marginTop: 0, gridRow: "2 / 3", gridColumn: "1 / 3", background: "whitesmoke", border: "solid 1px gray", height: 30 }}></div>
								{React.createElement(React.useCallback(() => {
									const frame = useCurrentFrame();
									const opacity = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
									return <div style={{ margin: 10, marginTop: 0, gridRow: "3 / 4", gridColumn: "1 / 3", background: "whitesmoke", border: "solid 1px gray", color: "#202020", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "repeat(10, auto)", opacity }}>
										<Page />
									</div>;
								}, []))}
							</div>
						</AbsoluteFill>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[15]}>
					<Base n={15} lswitch={[]}>
						<AbsoluteFill style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "1fr auto 1fr" }}>
							<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "1 / 2" }}></div>
							<div style={{ margin: 20, gridRow: "2 / 3", gridColumn: "2 / 3", fontSize: 50, color: "transparent" }}><TeX math="\Rightarrow" /></div>
							<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "3 / 4", display: "grid", gridTemplateColumns: "auto 1fr", gridTemplateRows: "auto auto 1fr", background: "darkgray", borderRadius: 10 }}>
								<div style={{ margin: 10, gridRow: "1 / 2", gridColumn: "1 / 2", background: "gray", width: 150, height: 30 }}></div>
								<div style={{ margin: 10, marginTop: 0, gridRow: "2 / 3", gridColumn: "1 / 3", background: "whitesmoke", border: "solid 1px gray", height: 30 }}></div>
								<div style={{ margin: 10, marginTop: 0, gridRow: "3 / 4", gridColumn: "1 / 3", background: "whitesmoke", border: "solid 1px gray", color: "#202020", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "repeat(10, auto)" }}>
									<Page />
								</div>
							</div>
						</AbsoluteFill>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[16]}>
					<Base n={16} lswitch={[]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const code_fadein = interpolate(frame, [30, 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							const arrow_fadein = interpolate(frame, [60, 90], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							const fadeout = interpolate(frame, [SequenceLength[16] - 20, SequenceLength[16]], [1, 0], { extrapolateLeft: "clamp" });
							return <AbsoluteFill style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "1fr auto 1fr", opacity: fadeout }}>
								<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "1 / 2", clipPath: `polygon(0 0, 100% 0, 100% ${code_fadein}%, 0 ${code_fadein}%)` }}>
									<SyntaxHighlighter language="tsx" style={atomDark}>
										{`const Page: React.FC = () => {
  return <>
    <div style={{ 
      fontSize: 20,
      gridRow: "1 / 2",
      gridColumn: "1 / 4" }}>nic●nic●</div>
    <FakeVideo x={0} y={0} color1={"blue"} color2={"pink"} />
    <FakeVideo x={0} y={1} color1={"blue"} color2={"pink"} />
    <FakeVideo x={0} y={2} color1={"blue"} color2={"pink"} />
    <FakeVideo x={0} y={3} color1={"blue"} color2={"pink"} />
    <FakeVideo x={0} y={4} color1={"blue"} color2={"pink"} />

    <FakeVideo x={1} y={0} color1={"red"} color2={"lime"} />
    <FakeVideo x={1} y={1} color1={"red"} color2={"lime"} />
    <FakeVideo x={1} y={2} color1={"red"} color2={"lime"} />
    <FakeVideo x={1} y={3} color1={"red"} color2={"lime"} />
    <FakeVideo x={1} y={4} color1={"red"} color2={"lime"} />

    <FakeVideo x={2} y={0} color1={"white"} color2={"purple"} />
    <FakeVideo x={2} y={1} color1={"white"} color2={"purple"} />
    <FakeVideo x={2} y={2} color1={"white"} color2={"purple"} />
    <FakeVideo x={2} y={3} color1={"white"} color2={"purple"} />
    <FakeVideo x={2} y={4} color1={"white"} color2={"purple"} />
  </>;
};`}
									</SyntaxHighlighter>
								</div>
								<div style={{ margin: 20, gridRow: "2 / 3", gridColumn: "2 / 3", fontSize: 50, clipPath: `polygon(0 0, ${arrow_fadein}% 0, ${arrow_fadein}% 100%, 0 100%)` }}><TeX math="\Rightarrow" /></div>
								<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "3 / 4", display: "grid", gridTemplateColumns: "auto 1fr", gridTemplateRows: "auto auto 1fr", background: "darkgray", borderRadius: 10 }}>
									<div style={{ margin: 10, gridRow: "1 / 2", gridColumn: "1 / 2", background: "gray", width: 150, height: 30 }}></div>
									<div style={{ margin: 10, marginTop: 0, gridRow: "2 / 3", gridColumn: "1 / 3", background: "whitesmoke", border: "solid 1px gray", height: 30 }}></div>
									<div style={{ margin: 10, marginTop: 0, gridRow: "3 / 4", gridColumn: "1 / 3", background: "whitesmoke", border: "solid 1px gray", color: "#202020", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "repeat(10, auto)" }}>
										<Page />
									</div>
								</div>
							</AbsoluteFill>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[17]}>
					<Base n={17} lswitch={[]}>
						<Header1><FadeinText text="Remotionのいいところ" /></Header1>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[18]}>
					<Base n={18} lswitch={["フィーちゃん立ち絵/!表情/!目/*キラーン"]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2><FadeinText text="Webブラウザの表現力が高い" /></Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[19]}>
					<Base n={19} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Webブラウザの表現力が高い</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[20]}>
					<Base n={20} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Webブラウザの表現力が高い</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[21]}>
					<Base n={21} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Webブラウザの表現力が高い</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[22]}>
					<Base n={22} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Webブラウザの表現力が高い</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[23]}>
					<Base n={23} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2><FadeinText text="Reactで動画を作る" /></Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[24]}>
					<Base n={24} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作る</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[25]}>
					<Base n={25} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作る<FadeinText text="のでライブラリが凄まじく充実" /></Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[26]}>
					<Base n={26} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作るのでライブラリが凄まじく充実</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[27]}>
					<Base n={27} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作るのでライブラリが凄まじく充実</Header2>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fade = interpolate(frame, [0, 20, SequenceLength[28] - 20, SequenceLength[28]], [0, 1, 1, 0]);
							const width = (700 - 430) / 2 * Math.sin(frame / 120 * Math.PI) + (430 + 700) / 2;
							return <div style={{ opacity: fade, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr" }}>
								<div style={{ gridColumn: "1 / 2", gridRow: "1 / 2", fontSize: 30 }}>(BudouX有り)</div>
								<div style={{ gridColumn: "2 / 3", gridRow: "1 / 2", fontSize: 30 }}>(BudouX無し)</div>
								<div style={{ gridColumn: "1 / 2", gridRow: "2 / 3", fontSize: 40, background: "#ffffff7f", border: "solid 5px #202020", height: 500, width }}><BudouXText text="あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。" /></div>
								<div style={{ gridColumn: "2 / 3", gridRow: "2 / 3", fontSize: 40, background: "#ffffff7f", border: "solid 5px #202020", height: 500, width }}>あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。</div>
							</div>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[28]}>
					<Base n={28} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作るのでライブラリが凄まじく充実</Header2>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fade = interpolate(frame, [0, 20, SequenceLength[28] - 20, SequenceLength[28]], [0, 1, 1, 0]);
							return <div style={{ opacity: fade, width: "100%", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "auto 1fr", fontSize: 30 }}>
								<div style={{ fontSize: 30 }}>(react-syntax-highlighter)</div>
								<div style={{ gridRow: "2 / 3" }}>
									<SyntaxHighlighter language="rust" style={atomDark}>
										{`// Rust

fn main() {
    println!("Hello, Rust!");
}`}
									</SyntaxHighlighter>
								</div>
								<div style={{ gridRow: "2 / 3" }}>
									<SyntaxHighlighter language="latex" style={atomDark}>
										{`% LaTeX

\\documentclass[dvipdfmx]{jsarticle}
\\begin{document}

Hello, \\LaTeX !

\\end{document}
`}
									</SyntaxHighlighter>
								</div>
							</div>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[29]}>
					<Base n={29} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作るのでライブラリが凄まじく充実</Header2>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fade = interpolate(frame, [0, 20, SequenceLength[28] - 20, SequenceLength[28]], [0, 1, 1, 0]);
							return <div style={{ opacity: fade, width: "100%", display: "grid", gridTemplateRows: "auto repeat(3, 1fr)", fontSize: 60 }}>
								<div style={{ fontSize: 30 }}>(react-katex)</div>
								<div style={{ marginTop: -50, }}>
									<TeX math="e^{i\pi}+1=0" block />
								</div>
								<div style={{ marginTop: -120, }}>
									<TeX math="\forall A\forall B (\forall x(x\in A\leftrightarrow x\in B)\Rightarrow A=B)" block />
								</div>
								<div style={{ marginTop: -180, }}>
									<TeX math="\sin x=\sum^\infty_{n=0}(-1)^n\frac{x^{2n+1}}{(2n+1)!}" block />
								</div>
							</div>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[30]}>
					<Base n={30} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>Reactで動画を作るのでライブラリが凄まじく充実</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[31]}>
					<Base n={31} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[32]}>
					<Base n={32} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2><FadeinText text="自動化がやりやすい" /></Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[33]}>
					<Base n={33} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>自動化がやりやすい</Header2>
						<Header3><FadeinText text="Remotionのプログラムを別のプログラムで自動生成するとか" /></Header3>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fadeout = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
							return <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "1fr auto 1fr", opacity: fadeout }}>
								<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "1 / 2" }}>
									<SyntaxHighlighter language="yaml" style={atomDark}>
										{`fee:
  name: フィーちゃん
  platform: CeVIO AI
  template:
    character: フィー
    voice: \${script_index}
    script: \${script}
    lab: \${lab}
---
- fee: みなさんこんにちは フィーです
- fee: さて、理工系の動画を作っているみなさん
- fee: 美しい動画を作りたいですよね
- fee: 例えば
- fee: 滑らかにアニメーションするグラフ
- fee: 美しくレンダリングされた数式
- fee: そして、私のこの口パク
- fee: この動画では、これを実現する方法の一つを紹介します`}
									</SyntaxHighlighter>
								</div>
								<div style={{ margin: 20, gridRow: "2 / 3", gridColumn: "2 / 3", fontSize: 50 }}><TeX math="\Rightarrow" /></div>
								<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "3 / 4" }}>
									<Header3><FadeinText text="csv(CeVIO AI用)" /></Header3>
								</div>
							</div>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[34]}>
					<Base n={34} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>自動化がやりやすい</Header2>
						<Header3>Remotionのプログラムを別のプログラムで自動生成するとか</Header3>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fadeout = interpolate(frame, [SequenceLength[34] - 30, SequenceLength[34]], [1, 0], { extrapolateLeft: "clamp" });
							return <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gridTemplateRows: "1fr auto 1fr", opacity: fadeout }}>
								<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "1 / 2" }}>
									<SyntaxHighlighter language="yaml" style={atomDark}>
										{`fee:
  name: フィーちゃん
  platform: CeVIO AI
  template:
    character: フィー
    voice: \${script_index}
    script: \${script}
    lab: \${lab}
---
- fee: みなさんこんにちは フィーです
- fee: さて、理工系の動画を作っているみなさん
- fee: 美しい動画を作りたいですよね
- fee: 例えば
- fee: 滑らかにアニメーションするグラフ
- fee: 美しくレンダリングされた数式
- fee: そして、私のこの口パク
- fee: この動画では、これを実現する方法の一つを紹介します`}
									</SyntaxHighlighter>
								</div>
								<div style={{ margin: 20, gridRow: "2 / 3", gridColumn: "2 / 3", fontSize: 50 }}><TeX math="\Rightarrow" /></div>
								<div style={{ margin: 20, gridRow: "1 / 4", gridColumn: "3 / 4" }}>
									<Header3>csv(CeVIO AI用)</Header3>
									<Header3><FadeinText text="口パク" /></Header3>
									<Header3><FadeinText text="シーンチェンジ" /></Header3>
								</div>
							</div>;
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[35]}>
					<Base n={35} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>自動化がやりやすい</Header2>
						<Header3>Remotionのプログラムを別のプログラムで自動生成するとか</Header3>
						<Header3><FadeinText text="立ち絵の組み換えをするサーバを立てておくとか" /></Header3>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[36]}>
					<Base n={36} lswitch={[]}>
						<Header1>Remotionのいいところ</Header1>
						<Header2>自動化がやりやすい</Header2>
						<Header3>Remotionのプログラムを別のプログラムで自動生成するとか</Header3>
						<Header3>立ち絵の組み換えをするサーバを立てておくとか</Header3>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[37]}>
					<Base n={37} lswitch={[]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fadeout = interpolate(frame, [60, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							return <>
								<Header1 style={{ opacity: fadeout }}>Remotionのいいところ</Header1>
								<Header2 style={{ opacity: fadeout }}>自動化がやりやすい</Header2>
								<Header3 style={{ opacity: fadeout }}>Remotionのプログラムを別のプログラムで自動生成するとか</Header3>
								<Header3 style={{ opacity: fadeout }}>立ち絵の組み換えをするサーバを立てておくとか</Header3>
							</>
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[38]}>
					<Base n={38} lswitch={[]}>
						<Header1><FadeinText text="Remotionの微妙なところ" /></Header1>
						<Header2><FadeinText from={20} text="手間がかかる" /></Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[39]}>
					<Base n={39} lswitch={["フィーちゃん立ち絵/!表情/!目/*かなしい"]}>
						<Header1>Remotionの微妙なところ</Header1>
						<Header2>手間がかかる</Header2>
						<Header3><FadeinText text="画像の表示位置などもテキストで指定しなければならない" /></Header3>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[40]}>
					<Base n={40} lswitch={["フィーちゃん立ち絵/!表情/!目/*かなしい"]}>
						<Header1>Remotionの微妙なところ</Header1>
						<Header2>手間がかかる</Header2>
						<Header3>画像の表示位置などもテキストで指定しなければならない</Header3>
						<Header3><FadeinText text="立ち絵のレイヤー切り替え指定にレイヤー名を書く必要がある" /></Header3>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[41]}>
					<Base n={41} lswitch={["フィーちゃん立ち絵/!表情/!目/*かなしい"]}>
						<Header1>Remotionの微妙なところ</Header1>
						<Header2>手間がかかる</Header2>
						<Header3>画像の表示位置などもテキストで指定しなければならない</Header3>
						<Header3>立ち絵のレイヤー切り替え指定にレイヤー名を書く必要がある</Header3>
						<Header3><FadeinText text="レンダリングが遅い" /></Header3>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[42]}>
					<Base n={42} lswitch={[]}>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const fadeout = interpolate(frame, [60, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							return <>
								<Header1 style={{ opacity: fadeout }}>Remotionの微妙なところ</Header1>
								<Header2 style={{ opacity: fadeout }}>手間がかかる</Header2>
								<Header3 style={{ opacity: fadeout }}>画像の表示位置などもテキストで指定しなければならない</Header3>
								<Header3 style={{ opacity: fadeout }}>立ち絵のレイヤー切り替え指定にレイヤー名を書く必要がある</Header3>
								<Header3 style={{ opacity: fadeout }}>レンダリングが遅い</Header3>
							</>
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[43]}>
					<Base n={43} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[44]}>
					<Base n={44} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[45]}>
					<Base n={45} lswitch={[]}>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[46]}>
					<Base n={46} lswitch={[]}>
						<Header1><FadeinText text="クレジット" /></Header1>
						<Header2><FadeinText text="CeVIO AI フィーちゃん" /></Header2>
						<Header2><FadeinText text="Remotion" /></Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[47]}>
					<Base n={47} lswitch={[]}>
						<Header1>クレジット</Header1>
						<Header2>CeVIO AI フィーちゃん</Header2>
						{React.createElement(React.useCallback(() => {
							const frame = useCurrentFrame();
							const l = interpolate(frame, [0, 30, SequenceLength[47] - 30, SequenceLength[47]], [100, 50, 50, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
							return <>
								<Header2 style={{ color: `hsl(${frame * 3}, 100%, ${l}%)` }}>Remotion</Header2>
							</>
						}, []))}
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[48]}>
					<Base n={48} lswitch={[]}>
						<Header1>クレジット</Header1>
						<Header2>CeVIO AI フィーちゃん</Header2>
						<Header2>Remotion</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[49]}>
					<Base n={49} lswitch={["フィーちゃん立ち絵/!表情/!目/*にっこり"]}>
						<Header1>クレジット</Header1>
						<Header2>CeVIO AI フィーちゃん</Header2>
						<Header2>Remotion</Header2>
					</Base>
				</Series.Sequence>
				<Series.Sequence durationInFrames={SequenceLength[50] + 60}>
					<Base n={50} lswitch={["フィーちゃん立ち絵/!表情/!目/*にっこり"]}>
						<Header1>クレジット</Header1>
						<Header2>CeVIO AI フィーちゃん</Header2>
						<Header2>Remotion</Header2>
					</Base>
				</Series.Sequence>
			</Series>
		</AbsoluteFill>
	</>;
};
