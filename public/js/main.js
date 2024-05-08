class Interval {
    constructor(element) {
        this.element = element;
        this._disabled = this.element.disabled;
    }

    get value() {
        if (!this._disabled) {
            return Infinity;
        } else {
            return Number(this.element.value) * 1000;
        }
    }

    set disabled(v) {
        this._disabled = Boolean(v);
        this.element.disabled = this._disabled;
    }

    get disabled() {
        return this._disabled;
    }
}

const time = document.querySelector('#time');

const elem_prevent_sleep = document.querySelector('#prevent-sleep');

const elem_lock_button = document.querySelector('#lock');
const elem_unlock_button = document.querySelector('#unlock');

const elem_start_button = document.querySelector('#start-button');
const elem_stop_button = document.querySelector('#stop-button');

const _interval = new Interval(document.querySelector('#voice-interval'));

const elem_display_format = document.querySelector('#display-format');
const elem_voice_format = document.querySelector('#voice-format');

const elem_reset_button = document.querySelector('#reset-button');


const update = fmt => {
    //const _date = new Date();
    time.textContent = moment().format(fmt) //_date.toLocaleString(fmt);
}

let _wakeLock = null;
const wake_lock = async _ => {
    try {
        _wakeLock = await navigator.wakeLock.request('screen');
        _wakeLock.addEventListener('release', _ => {
            console.log('wakeLock: off (released)');
        }, { once: true });
        console.log('wakeLock: on (locked)');
    } catch(e) {
        console.error(e);
    }
}

let _clock = 0;
const main = async _timestamp => {
    update(elem_display_format.value);

    if (_timestamp - _clock >= _interval.value) {
        _clock = _timestamp;

        const _announce = moment().format(elem_voice_format.value);
        const _utter = new SpeechSynthesisUtterance(_announce);
        window.speechSynthesis.speak(_utter);

        requestAnimationFrame(main);
    } else if (_interval.value < Infinity) {
        requestAnimationFrame(main);
    }
    
    return;
}

const _change_visible = async _ => {
    if (_wakeLock !== null && document.visibilityState === 'visible') {
        await wake_lock();
    }
};
const _click_lock = async _ => {
    elem_lock_button.disabled = true;
    elem_unlock_button.disabled = false;

    await wake_lock();
    document.addEventListener('visibilitychange', _change_visible);
    
    elem_unlock_button.addEventListener('click', _click_unlock, { once: true });
};
const _click_unlock = async _ => {
    elem_lock_button.disabled = false;
    elem_unlock_button.disabled = true;

    document.removeEventListener('visibilitychange',_change_visible);
    if (_wakeLock !== null) {
        await _wakeLock.release();
    }

    elem_lock_button.addEventListener('click', _click_lock, { once: true });
};

const _click_lock_fallback = _ => {
    elem_lock_button.disabled = true;
    elem_unlock_button.disabled = false;

    elem_prevent_sleep.play();
    
    elem_unlock_button.addEventListener('click', _click_unlock_fallback, { once: true });
};
const _click_unlock_fallback = async _ => {
    elem_lock_button.disabled = false;
    elem_unlock_button.disabled = true;

    await elem_prevent_sleep.pause();

    elem_lock_button.addEventListener('click', _click_lock_fallback, { once: true });
};


if ('wakeLock' in navigator) {
//if (false) { // for debug
    console.log('wakeLock: supported browser');
    elem_lock_button.addEventListener('click', _click_lock);
} else {
    console.log('wakeLock: non-supported browser (fallback mode)');
    elem_prevent_sleep.addEventListener('canplaythrough', _ => {
        console.log('wakeLock[fallback]: video loaded');
        elem_prevent_sleep.pause();
        elem_lock_button.addEventListener('click', _click_lock_fallback);
    }, { once: true });
}
elem_lock_button.disabled = false;


const _local_storage = localStorage.getItem('setting');
if (!!_local_storage) {
    const _json_data = JSON.parse(_local_storage);
    _interval.element.value = _json_data.interval;
    elem_display_format.value = _json_data.format.display;
    elem_voice_format.value = _json_data.format.voice;
}
update(elem_display_format.value);


elem_start_button.addEventListener('click', _ => {
    _interval.disabled = true;
    elem_start_button.disabled = true;
    elem_stop_button.disabled = false;
    elem_display_format.disabled = true;
    elem_voice_format.disabled = true;

    window.localStorage.setItem(
        'setting',
        JSON.stringify({
            interval: Number.isFinite(_interval.value) ? _interval.value / 1000 : 300,
            format: {
                display: !!elem_display_format.value ? elem_display_format.value : "HH:mm:ss",
                voice: !!elem_voice_format.value ? elem_voice_format.value : "H 時 m 分"
            }
        })
    );

    requestAnimationFrame(main);
});

elem_stop_button.addEventListener('click', _ => {
    _interval.disabled = false;
    elem_start_button.disabled = false;
    elem_stop_button.disabled = true;
    elem_display_format.disabled = false;
    elem_voice_format.disabled = false;
});

elem_reset_button.addEventListener('click', _ => {
    window.localStorage.clear();
    window.location.reload();
});


/*
elem_prevent_sleep.addEventListener('timeupdate', _ => {
    console.log('wakeLock[fallback]: video playing...');
});
*/
elem_prevent_sleep.addEventListener('pause', _ => {
    console.log('wakeLock[fallback]: video pause');
});
elem_prevent_sleep.addEventListener('play', _ => {
    console.log('wakeLock[fallback]: video start');
});

/*
fetch('./sample-video-2.mp4')
.then(res => res.blob())
.then(blob => {
    const reader = new FileReader();
    reader.addEventListener('load', _ => {
        console.log(reader.result);
    });
    reader.readAsDataURL(blob);
});
*/