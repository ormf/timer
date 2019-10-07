/*

timer.js

**********************************************************************
Copyright (c) 2019 Ugo Finnendahl <ugogon@hotmail.de>
                   Orm Finnendahl <orm.finnendahl@selma.hfmdk-frankfurt.de>

Revision history: See git repository.

This program is free software; you can redistribute it and/or
modify it under the terms of the Gnu Public License, version 2 or
later. See https://www.gnu.org/licenses/gpl-2.0.html for the text
of this agreement.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

*/

class Timer {
    constructor(display_element, sound_element) {
        this.total = 30;
        this.todo = undefined;
        this.target = undefined;
        this.timer = undefined;
        this.last_tick = this.now();
        this.up = true;
        this.running = false;
        this.loop = 0;
        this.mute = false;
        this.sound = sound_element;
        this.timedisplay = display_element;
        this.inverted = false;
        this.reset();
        setInterval(this.tick.bind(this), 1000);
    }
    now(){
        return new Date().getTime();
    }
    set(target){
        var old = this.total;
        this.total = target;
        if (this.running){
            this.todo += (target-old)*1000;
            if (this.todo < 0){
                this.todo = 0;
            }
            this.displaytime();
        } else {
            this.reset();
        }
    }
    setovertime (bool) {
        if (bool && !this.inverted) {
            document.getElementById('timedisplay').classList.add("overtimedigits");
            this.inverted = true;
        }
        else if (!bool && this.inverted) {
            document.getElementById('timedisplay').classList.remove("overtimedigits");
            this.inverted = false;
        }
    }
    ring(){
        if (!this.mute) this.sound.play();
        document.getElementById('timedisplay').classList.add("inverteddigits");
        setTimeout(function(){this.stopRing()}.bind(this), 1000);
        setTimeout(function(){this.stopflash()}.bind(this), 400);
    }
    stopRing(){
        this.sound.pause();
    }
    stopflash () {
        document.getElementById('timedisplay').setAttribute("class","digits");
    }
    tick(){
        if (this.running) {
            var now = this.now();
            this.todo -= (now-this.last_tick);
            if (Math.round(this.todo/1000) == 0) {
                this.ring();
                setTimeout(function(){this.stopRing()}.bind(this), 1000);
                switch (this.loop) {
                case 0:
                    this.reset();
                    break;
                case 1:
                    this.running = false;
                    update_button(document.getElementById('ttoggle'), this.running);
                    this.displaytime();
                    break;
                default:
                    this.displaytime();
                }
            } else {
                this.displaytime();
            }
            this.last_tick = now;
        }
    }


    displaytime(){
        var time = Math.round(this.todo/1000);
        if (this.up){
            time = this.total-time;
        }
        if (time < 0) time *= -1;
        time = Math.abs(time);
        var hours = Math.floor((time % (60 * 60 * 24)) / (60 * 60));
        var minutes = Math.floor((time % (60 * 60)) / 60);
        var seconds = Math.floor(time % 60);
        [hours, minutes, seconds] = [hours, minutes, seconds].map((a) => a.toLocaleString('en', {minimumIntegerDigits:2}))
        this.timedisplay.innerHTML = `${hours}:${minutes}:${seconds}`;
        this.setovertime(Math.round(this.todo/1000) < 0);
    }
    start(){
        this.last_tick = this.now();
        this.running = true;
    }
    pause(){
        this.todo -= (this.now()-this.last_tick);
        this.running = false;
        this.displaytime();
    }
    reset(){
        this.todo = this.total*1000;
        this.displaytime();
    }
}

//--------------------- View --------------------------------------------------

function update_view(){
    update_button(document.getElementById('ttoggle'), timer.running);
    update_button(document.getElementById('tdirection'), timer.up);
    update_radio(document.getElementById('tloop'), timer.loop);
    update_button(document.getElementById('tmute'), timer.mute);
}

function update_radio(button, condition){
    switch (condition) {
    case 0 : { button.style.backgroundImage = `url(${button.dataset.url0})`; break }
    case 1 : { button.style.backgroundImage = `url(${button.dataset.url1})`; break }
    case 2 : { button.style.backgroundImage = `url(${button.dataset.url2})`; break }
    }
}

function update_button(button, condition){
    if (condition) {
        button.style.backgroundImage = `url(${button.dataset.onurl})`;
    } else {
        button.style.backgroundImage = `url(${button.dataset.offurl})`;
    }
}

function update_selection(hr_obj, hm_obj, hs_obj){
    var hours = Math.floor((timer.total % (60 * 60 * 24)) / (60 * 60));
    var minutes = Math.floor((timer.total % (60 * 60)) / 60);
    var seconds = Math.floor(timer.total % 60);
    hr_obj.value = hours;
    hm_obj.value = minutes;
    hs_obj.value = seconds;
}

function recalcTotal(hr_obj, hm_obj, hs_obj){
    timer.set(parseInt((hr_obj.value * 3600),10) + parseInt((hm_obj.value * 60),10) + parseInt(hs_obj.value, 10));
}

function createSel(max) {
    var selector = document.createElement("select");
    for (var i=0; i<=max; i++) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.innerHTML = i.toLocaleString('en', {minimumIntegerDigits:2});
        selector.appendChild(opt);
    }
    return selector
}


//--------------------- Init --------------------------------------------------
var images = [];

function preload() {
  var max = images.length;
    for (var i = max; i < max+arguments.length; i++) {
      console.log(preload.arguments[i-max]);
        images[i] = new Image();
        images[i].src = preload.arguments[i-max];
    }
}

var timer;

function init(){
    [document.getElementById('ttoggle'),
     document.getElementById('tdirection'),
     document.getElementById('tmute')].map((a) => preload(a.dataset.onurl,a.dataset.offurl));
    preload(document.getElementById('tloop').dataset.url0,
    document.getElementById('tloop').dataset.url1,
    document.getElementById('tloop').dataset.url2)

    timer = new Timer(document.getElementById("timedisplay"),document.getElementById("alarm-sound"));
    document.getElementById('ttoggle').addEventListener("click", function(){
        if (timer.running) {
            timer.pause();
        } else {
            timer.start();
        }
        update_button(this, timer.running);
    });
    document.getElementById('treset').addEventListener("click", function(){
        timer.reset();
    });
    document.getElementById('tdirection').addEventListener("click", function(){
        timer.up = !timer.up;
        timer.displaytime()
        update_button(this, timer.up);
    });
    document.getElementById('tloop').addEventListener("click", function(){
        timer.loop = (timer.loop+1) % 3;
        update_radio(this, timer.loop);
    });
    document.getElementById('tmute').addEventListener("click", function(){
        timer.mute = !timer.mute;
        update_button(this, timer.mute);
    });
    update_view();

    var thr = createSel(23);
    document.getElementById("tpick-h").appendChild(thr);
    var thm = createSel(59);
    document.getElementById("tpick-m").appendChild(thm);
    var ths = createSel(59);
    document.getElementById("tpick-s").appendChild(ths);

    update_selection(thr, thm, ths);

    [thr, thm, ths].map((a) => a.addEventListener("change", function(){recalcTotal(thr, thm, ths)}));
}

window.addEventListener("load", init);
