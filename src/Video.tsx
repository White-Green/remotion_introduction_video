import { Composition, Still } from 'remotion';
import { Thumbnail, Main, MainLength } from './Composition';

export const RemotionVideo: React.FC = () => {
	return (
		<>
			<Still
				id="Thumbnail"
				component={Thumbnail}
				height={1080}
				width={1920}
			/>
			<Composition
				id="Main"
				component={Main}
				durationInFrames={MainLength}
				fps={60}
				width={1920}
				height={1080}
			/>
		</>
	);
};
