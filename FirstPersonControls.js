import {
	MathUtils,
	Spherical,
	Vector3
} from 'three';

const _lookDirection = new Vector3();
const _spherical = new Spherical();
const _target = new Vector3();


class FirstPersonControls {

	constructor( object, domElement ) {

		this.object = object;
		this.domElement = domElement;

		// API

		this.dampener = 0.05;

		this.enabled = true;

		this.movementSpeed = 1.0;
		this.lookSpeed = 0.005;

		this.lookVertical = true;
		this.autoForward = false;

		this.activeLook = true;

		this.heightSpeed = false;
		this.heightCoef = 1.0;
		this.heightMin = 0.0;
		this.heightMax = 1.0;

		this.constrainVertical = false;
		this.verticalMin = 0;
		this.verticalMax = Math.PI;

		this.mouseDragOn = false;

		// internals

		this.autoSpeedFactor = 0.0;

		this.pointerX = 0;
		this.pointerY = 0;

		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;

		this.viewHalfX = 0;
		this.viewHalfY = 0;

		// private variables

		let lat = 0;
		let lon = 0;

		//

		this.handleResize = function () {

			if ( this.domElement === document ) {

				this.viewHalfX = window.innerWidth / 2;
				this.viewHalfY = window.innerHeight / 2;

			} else {

				this.viewHalfX = this.domElement.offsetWidth / 2;
				this.viewHalfY = this.domElement.offsetHeight / 2;

			}

		};

		this.onPointerDown = function ( event ) {

			if ( this.domElement !== document ) {

				this.domElement.focus();

			}

			this.mouseDragOn = true;

		};

		this.onPointerUp = function ( event ) {

			this.mouseDragOn = false;

		};

		this.onPointerMove = function ( event ) {

			if ( this.domElement === document ) {

				this.pointerX = event.pageX - this.viewHalfX;
				this.pointerY = event.pageY - this.viewHalfY;

			} else {

				this.pointerX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
				this.pointerY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

			}

		};

		this.onKeyDown = function ( event ) {

			switch ( event.code ) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = true; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = true; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = true; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = true; break;

				case 'KeyR': this.moveUp = true; break;
				case 'KeyF': this.moveDown = true; break;

			}

		};

		this.onKeyUp = function ( event ) {

			switch ( event.code ) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = false; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = false; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = false; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = false; break;

				case 'KeyR': this.moveUp = false; break;
				case 'KeyF': this.moveDown = false; break;

			}

		};

		this.lookAt = function ( x, y, z ) {

			if ( x.isVector3 ) {

				_target.copy( x );

			} else {

				_target.set( x, y, z );

			}

			this.object.lookAt( _target );

			setOrientation( this );

			return this;

		};

		this.update = function () {

			const targetPosition = new Vector3();

			return function update( delta ) {

				if ( this.enabled === false ) return;

				if ( this.heightSpeed ) {

					const y = MathUtils.clamp( this.object.position.y, this.heightMin, this.heightMax );
					const heightDelta = y - this.heightMin;

					this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

				} else {

					this.autoSpeedFactor = 0.0;

				}

				const actualMoveSpeed = delta * this.movementSpeed;

				var vz = 0
				var vx = 0

				if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) vz = ((actualMoveSpeed + this.autoSpeedFactor ) * - this.dampener) ;
				if ( this.moveBackward ) vz = ((actualMoveSpeed + this.autoSpeedFactor ) * this.dampener);

				if ( this.moveLeft ) vx = ((actualMoveSpeed) * - this.dampener)
				if ( this.moveRight ) vx = ((actualMoveSpeed) * this.dampener)

				move(vz, vx, this.object)

				let actualLookSpeed = delta * this.lookSpeed;

				if ( ! this.activeLook ) {

					actualLookSpeed = 0;

				}

				let verticalLookRatio = 1;

				if ( this.constrainVertical ) {

					verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

				}

				lon -= this.pointerX * actualLookSpeed;
				if ( this.lookVertical ) lat -= this.pointerY * actualLookSpeed * verticalLookRatio;

				lat = Math.max( - 85, Math.min( 85, lat ) );

				let phi = MathUtils.degToRad( 90 - lat );
				const theta = MathUtils.degToRad( lon );

				if ( this.constrainVertical ) {

					phi = MathUtils.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );

				}

				const position = this.object.position;

				targetPosition.setFromSphericalCoords( 1, phi, theta ).add( position );

				this.object.lookAt( targetPosition );

			};

		}();

		this.dispose = function () {

			this.domElement.removeEventListener( 'contextmenu', contextmenu );
			this.domElement.removeEventListener( 'pointerdown', _onPointerDown );
			this.domElement.removeEventListener( 'pointermove', _onPointerMove );
			this.domElement.removeEventListener( 'pointerup', _onPointerUp );

			window.removeEventListener( 'keydown', _onKeyDown );
			window.removeEventListener( 'keyup', _onKeyUp );

		};

		const _onPointerMove = this.onPointerMove.bind( this );
		const _onPointerDown = this.onPointerDown.bind( this );
		const _onPointerUp = this.onPointerUp.bind( this );
		const _onKeyDown = this.onKeyDown.bind( this );
		const _onKeyUp = this.onKeyUp.bind( this );

		this.domElement.addEventListener( 'contextmenu', contextmenu );
		this.domElement.addEventListener( 'pointerdown', _onPointerDown );
		this.domElement.addEventListener( 'pointermove', _onPointerMove );
		this.domElement.addEventListener( 'pointerup', _onPointerUp );

		window.addEventListener( 'keydown', _onKeyDown );
		window.addEventListener( 'keyup', _onKeyUp );

		function setOrientation( controls ) {

			const quaternion = controls.object.quaternion;

			_lookDirection.set( 0, 0, - 1 ).applyQuaternion( quaternion );
			_spherical.setFromVector3( _lookDirection );

			lat = 90 - MathUtils.radToDeg( _spherical.phi );
			lon = MathUtils.radToDeg( _spherical.theta );

		}

		this.handleResize();

		setOrientation( this );

	}

}

function contextmenu( event ) {

	event.preventDefault();

}

function move(vz, vx, camera){
	var dir = 1
	var localZX = Math.sin(camera.rotation.y)*vz 
	var localZZ = Math.cos(camera.rotation.y)*vz 

	var localXX = -Math.sin(camera.rotation.y - 2*(Math.PI)/4)*vx 
	var localXZ = -Math.cos(camera.rotation.y - 2*(Math.PI)/4)*vx 

	if ((camera.rotation.y % (2 * Math.PI)) > Math.PI){
		dir = -1
	}
	if(vx != 0){
		camera.position.x += localXX * dir
		camera.position.z += localXZ * dir
	}
	if(vz != 0){
		camera.position.x += localZX * dir
		camera.position.z += localZZ * dir
	}
}


export { FirstPersonControls };
