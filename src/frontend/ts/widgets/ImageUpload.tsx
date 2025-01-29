import m, {Component, Vnode} from "mithril";
import {Lang} from "../../../shared/Lang";

interface ImageUploadComponentOptions {
	defaultValue: string
	maxSize: number
	callback: (base64: string) => void
}

class ImageUploadComponent implements Component<ImageUploadComponentOptions, unknown> {
	private value: string = ""
	private error: string = ""
	
	private imageToBase64(callback: (base64: string) => void, maxSize: number, event: InputEvent): void {
		const target = event.target as HTMLInputElement
		if(!target || !target.files)
			return
		
		const file = target.files[0];
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			if(!reader.result) {
				this.error = Lang.get("errorUnknown")
				return
			}
			
			const img = new Image()
			img.src = reader.result.toString()
			
			img.onload = () => {
				if(img.width <= maxSize && img.height <= maxSize) { //Image is small enough, we can just use it as is
					callback(img.src)
					this.value = img.src
					return
				}
				
				const canvas = document.createElement("canvas")
				
				//Fix size:
				if(img.width > maxSize && img.width > img.height) {
					const scaleX = maxSize / img.width
					
					canvas.width = maxSize;
					canvas.height = img.height * scaleX;
				}
				else if(img.height > maxSize){
					const scaleY = maxSize / img.height
					
					canvas.width = img.width * scaleY;
					canvas.height = maxSize;
				}
				
				//Create new image:
				const canvasContext = canvas.getContext("2d");
				if(!canvasContext) {
					this.error = Lang.get("errorUnknown")
					return
				}
				canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);
				
				this.value = canvasContext.canvas.toDataURL()
				callback(this.value)
				this.error = ""
			}
		}
		reader.onerror = (error) => {
			this.error = error.toString()
		}
	}
	
	oncreate(vNode: Vnode<ImageUploadComponentOptions, unknown>): void {
		const options = vNode.attrs
		this.value = options.defaultValue
	}
	
	view(vNode: Vnode<ImageUploadComponentOptions, unknown>): Vnode {
		const options = vNode.attrs
		
		return <label>
			<small>{ Lang.get("iconDataUrl") }</small>
			<div class="imageUploadEditor horizontal vAlignCenter">
				{ this.value && <img src={ this.value } alt="icon" class="icon"/> }
				<input type="file" accept="image/*" onchange={ this.imageToBase64.bind(this, options.callback, options.maxSize) }/>
				{ this.error && <small class="warn">{this.error}</small> }
			</div>
		</label>
	}
}

export function ImageUpload(currentValue: string, maxSize: number, callback: (base64: string) => void): Vnode<ImageUploadComponentOptions, unknown> {
	return m(ImageUploadComponent, {
		defaultValue: currentValue,
		maxSize: maxSize,
		callback: callback
	})
}
