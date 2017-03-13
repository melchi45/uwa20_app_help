function G726xAudioDecoder(bits){
	var decoder = null;

	switch(bits){
		case 16:
			decoder = new G726_16_AudioDecoder();
			break;
		case 24 :
			decoder = new G726_24_AudioDecoder();
			break;
		case 32:
			decoder = new G726_32_AudioDecoder();
			break;
		case 40:
			decoder = new G726_40_AudioDecoder();
			break;
		default:
			console.log("wrong bits")
			break;
	}

	return decoder;
}