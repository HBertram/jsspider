var play = {}
play.class = {}
play.started = false;
play.cardColor = {
    WSpade : 1,
    WHeart : 2,
    WClub : 3,
    WDiamond : 4,
    BSpade : 5,
    BHeart : 6,
    BClub : 7,
    BDiamond : 8,
    Blank : 0
}
play.ShowType = {
    display : 1,
    back : 2,
    invisible : 0
}
play.cardDeck = Array(104);

play.createCard = function(color, point, showtype, x, y) {
    if (color instanceof play.class.Card) {
        return new play.class.Card(color.color, color.point, color.showtype, color.x, color.y);
    }
    return new play.class.Card(color, point, showtype);
}
play.class.Card = function(color, point, showtype, x, y) {
    this.point = point;
    this.color = color;
    this.x = x;
    this.y = y;
    if (undefined != showtype) {
        this.showtype = showtype;
    } else {
        this.showtype = play.ShowType.back;
    }
}
play.class.Card.prototype = {
    copy : function(){
        return play.createCard(this);
    }
}

play.emptyCard = play.createCard(0,0,0);

play.init = function(){
    play.isClicked = false;
    play.hintIndex = 0;
    play.lastHintCards = undefined;
    play.lastHintSteps = undefined;
}

play.start = function() {
    draw.init();
    play.init();
    AI.init();
    setTimeout(play.startNew, 100);
}
play.startNew = function(){
    play.trace = Array();
    play.stepCount = 0;
    play.cheatCount = 0;
    play.undoCount = 0;
    play.isCheating = false;
    play.startTime = new Date().getTime();
    play.chooseDifficult();
    //play.end();
}

play.continueStart = function() {
    draw.reScale();
    play.prepareCards(play.diff);
    play.startgame();
}

play.confirmDiff = function() {
    //draw.fullScreen();
    play.diff = $("input[type='radio']:checked").val();
    $('#setDiff').attr('hidden', 'hidden');
    $('#success').attr('hidden', 'hidden');
    play.continueStart();
}
play.cancelDiff = function() {
    $('#setDiff').attr('hidden', 'hidden');
}

play.chooseDifficult = function() {
    $('#setDiff').removeAttr('hidden');
}
play.playCards = function() {
    
}
play.prepareCards = function(diff) {
    //创建卡堆  cardDeck
    var cardIndex = 0;
    for (var i = 0; i < diff; i++) {
        for (var j = 0; j < 13; j++) {
            play.cardDeck[cardIndex++] = play.createCard(i+1, j+1);
        }
        if (cardIndex < 104 && i==diff-1) {
            i = -1;
        }
    }
    play.cards = Array(10);
    play.leftCards = 104;
    play.decks = Array(6);
    for (var i = 0; i < play.cards.length; i++) {
        play.cards[i] = Array(i > 3 ? 4 : 5);
        for (var j = 0; j < play.cards[i].length; j++) {
            play.cards[i][j] = play.getRandCard();
        }
    }
    for (var i = 0; i < play.decks.length; i++) {
        play.decks[i] = Array(10);
        for (var j = 0; j < play.decks[i].length; j++) {
            play.decks[i][j] = play.getRandCard();
        }
    }
}
play.getRandCard = function() {
    if (play.leftCards > 0) {
        var index = Math.floor(Math.random()*play.leftCards--);
        var toRe = play.cardDeck.splice(index, 1)[0];
        play.cardDeck.push(toRe);
        if (!toRe) {
            debugger;
        }
        return toRe.copy();
    } else {
        console.log('try to get from empty deck');
        return play.createCard(0,0);
    }
}

play.startgame = function() {
    play.started = true;
    play.drawMap();
    play.deal();
    play.trace.pop();
}

play.copyList = function(l) {
    var lc = Array(l.length);
    for (var i = 0; i < l.length; i++) {
        lc[i] = l[i].copy();
    }
    return lc;
}

play.drawMap = function(ischeat) {
    if (ischeat) {
        var cp = new Array(10);
        var toDrawline = Array(10);
        for (var i = 0; i < 10; i++) {
            cp[i] = play.copyList(play.cards[i]);
            toDrawline[i] = 0;
            for (var j = 0; j < cp[i].length; j++) {
                if (cp[i][j].showtype == play.ShowType.back) {
                    cp[i][j].showtype = play.ShowType.display;
                } else {
                    toDrawline[i] = j;
                    break;
                }
            }
        }
        draw.drawMap(cp, play.decks);
        for (var i = 0; i < cp.length; i++) {
            draw.drawCheat(cp[i], toDrawline[i]);
        }
        cp = undefined;
    } else {
        draw.drawMap(play.cards, play.decks);
    }
}

play.mousedown = function(event) {
    var x = event.clientX;
    var y = event.clientY;
    play.focus(x, y);
}
play.mousemove = function(event) {
    var x = event.clientX;
    var y = event.clientY;
    play.focusMove(x, y);
}
play.mouseup = function(event) {
    var x = event.clientX;
    var y = event.clientY;
    play.release(x,y);
}
play.touchstart = function(event) {
    event.preventDefault();
    touch = event.changedTouches[0];
    if (touch) {
        var x = touch.clientX;
        var y = touch.clientY;
        play.focus(x, y);
    }
}
play.touchmove = function(event) {
    event.preventDefault();
    touch = event.changedTouches[0];
    if (touch) {
        var x = touch.clientX;
        var y = touch.clientY;
        play.focusMove(x, y);
    }
}
play.touchend = function(event) {
    event.preventDefault();
    touch = event.changedTouches[0];
    if (touch) {
        var x = touch.clientX;
        var y = touch.clientY;
        play.release(x, y);
    }
}
play.focus = function(x, y) {
    draw.reScale();
    if (!play.started) {
        return;
    }
    if (play.isCheating) {
        play.onUncheat();
        return;
    }
    listIndex = draw.getListIndex(x, y);
    if (listIndex.listIndex == -1) {
        play.deal();
    } else if (!isNaN(listIndex.listIndex) && play.isMoveable(play.cards[listIndex.listIndex], listIndex.cardIndex)) {
        if (!play.isClicked) {
            play.isClicked = true;
            play.clickedListIndex = listIndex.listIndex;
            tempList = play.cards[listIndex.listIndex].slice(listIndex.cardIndex);
            play.movingList = play.copyList(tempList);
            for (var i = 0; i < tempList.length; i++) {
                tempList[i].showtype = play.ShowType.invisible;
            }
            play.clickedX = x;
            play.clickedY = y;    
        }
    }
}
play.focusMove = function(x, y) {
    if (play.isClicked) {
        draw.redraw(play.cards, play.decks, play.movingList, x-play.clickedX, y-play.clickedY);
    }
}
//移动接口
play.move = function(from, to, count) {
    var len = play.cards[from].length;
    var list = play.cards[from].splice(len-count);
    play.cards[to] = play.cards[to].concat(list);
    for (var i = 0; i < list.length; i++) {
        list[i].showtype = play.ShowType.display;
    }
    len = play.cards[from].length;
    if (len>0 && play.cards[from][len-1].showtype == play.ShowType.back) {
        play.cards[from][len-1].showtype = play.ShowType.display;
    }
    play.stepCount++;
    if (play.checkDone(play.cards[to])) {
        play.doneCards(play.cards[to]);
        play.trace = Array();
    } 
}
play.clearInvisible = function(l, showtype) {
    if (undefined == showtype) {
        showtype = play.ShowType.display;
    }
    for (var i = 0; i < l.length; i++) {
        if (l[i].showtype == play.ShowType.invisible) {
            l[i].showtype = showtype;
        }
    }
}
play.release = function(x, y) {
    if (!play.isClicked) {
        return;
    }
    listIndex = draw.getListIndex(x, y).listIndex;
    var toPut = play.clickedListIndex;
    if (!isNaN(listIndex) && listIndex != -1) {
        if (play.isCanPut(play.movingList, play.cards[listIndex])) {
            play.moveLog(play.clickedListIndex, listIndex, play.movingList.length);
            play.move(play.clickedListIndex, listIndex, play.movingList.length);
            //var orig = play.cards[toPut];
            //if (orig.length > 0) {
            //    orig[orig.length-1].showtype = play.ShowType.display;
            //}
            toPut = listIndex;
        }
    }
    play.clearInvisible(play.cards[toPut]);
    //play.cards[toPut] = play.cards[toPut].concat(play.movingList);
    //play.stepCount++;
    play.drawMap();
    play.clearClick();
}
play.clearClick = function() {
    play.isClicked = undefined;
    play.clickedListIndex = undefined;
    play.movingList = undefined;
    play.clickedX = undefined;
    play.clickedY = undefined;
}
play.isCanPut = function(movingList, list){
    if (list.length==0) {
        return true;
    }
    var card = list[list.length-1];
    if (card.showtype == play.ShowType.display && card.point-1 == movingList[0].point) {
        return true;
    }
    return false;
}
play.isMoveable = function(list, index) {
    if (list.length <= 0 || index >= list.length) {
        return false;
    }
    var moveable = true;
    var color = list[index].color;
    var point = list[index].point;
    for (var i = index+1; i < list.length; i++) {
        if (list[i].color != color || list[i].point != point-1) {
            moveable = false;
            break;
        }
        point--;
    }
    return moveable;
}
play.checkDone = function(list) {
    if (list.length < 13) {
        return false;
    }
    var done = true;
    var point = 1;
    var color = list[list.length-1].color;
    for (var i = list.length-1; point <= 13 && i >= 0; i--) {
        if (list[i].point != point++ || list[i].color != color) {
            done = false;
            break;
        }
    }
    return done;
}
play.doneCards = function(list) {
    if (list.length < 13) {
        return false;
    }
    list.splice(list.length-13);
    if (list.length > 0) {
        list[list.length-1].showtype = play.ShowType.display;
    }
    play.drawMap();
    
    if (play.isSuccess()) {
        play.success();
    }
}
play.isSuccess = function() {
    var isSuccess = true;
    for (var i = 0; i < play.cards.length; i++) {
        if (play.cards[i].length > 0) {
            isSuccess = false;
            break;
        }
    }
    return isSuccess;
}
play.hint = function() {
    play.hintIndex++;
    steps = AI.getMoveSteps(play.cards);
    if (steps && steps.length > 0) {
        if (play.hintIndex >= steps.length) {
            play.hintIndex = 0;
        }
        play.drawHint(steps[play.hintIndex]);
    }
}
play.drawHint = function(step) {
    play.drawMap();
    draw.drawHint(play.cards, step);
}
play.AIHint = function() {
    play.hintIndex++;
    //不同一局势提示
    var steps;
    if (!AI.compareCards(play.lastHintCards, play.cards)) {
        var isSearched = false;
        //若直接沿着原先搜索的思路走下去时
        if (!!play.lastHintSteps && play.lastHintSteps.length > 3) {
            steps = play.lastHintSteps;
            for (var i = 0; i < steps.length-3; i++) {
                if (AI.compareCards(steps[i].cards, play.cards)) {
                    steps.shift(i+1);
                    isSearched = true;
                    break;
                }
            }
        }
        if (!isSearched) {
            steps = AI.AIHint(play.cards);
            play.lastHintSteps = steps; 
        }
    } else {
        steps = play.lastHintSteps;
    }
    
    //画出提示
    play.lastHintCards = AI.copyCards(play.cards);
    if (steps.length > 0) {
            play.drawHint(steps[0]);
    }
    return steps;
}
play.success = function() {
    var used = new Date().getTime() - play.startTime;
    var usedtime = '';
    used /= 1000;
    if (used >= 0) {
        usedtime = Math.floor(used%60) + " 秒 ";
        used /= 60;
    }
    if (used >= 1) {
        usedtime = Math.floor(used%60) + " 分 " + usedtime;
        used /= 60;
    }
    if (used >= 1) {
        usedtime = Math.floor(used%60) + " 时 " + usedtime;
        used /= 60;
    }
    $('#time').text("共用时 "  + usedtime + " 步数 " + play.stepCount);
    $('#message').text("作弊 " + play.cheatCount + " 次  撤销 " + play.undoCount + " 次");
    $('#success').removeAttr('hidden');
}
play.deal = function() {
    var deck = play.decks.pop();
    for (var i = 0; i < 10; i++) {
        deck[i].showtype = play.ShowType.display;
        play.cards[i].push(deck[i]);
        play.drawMap();
    }
    //dealLog
    play.trace.push({type:'deal'});
}
play.onCheat = function() {
    if (play.isCheating) {
        play.onUncheat();
        return;
    } else {
        play.drawMap(true);
        play.isCheating = true;
    }
}
play.onUncheat = function() {
    play.drawMap();
    play.cheatCount++;
    play.isCheating = false;
}
play.moveLog = function(fromIndex, toIndex, cardCount) {
    var or = play.cards[fromIndex];
    play.trace.push({type:'move',from:fromIndex, to:toIndex, count:cardCount, isDrawn:(or.length-cardCount>0&&or[or.length-1-cardCount].showtype==play.ShowType.back)?true:false});
}

play.undo = function() {
    if (!play.started) {
        return;
    }
    var t = play.trace.pop();
    if (!t) {
        return;        
    }
    play.undoCount ++;
    if (t.type=='move') {
        play.stepCount --;
        
        var from = t.from;
        var to = t.to;
        var len = t.count;
        var list = play.cards[to].splice(play.cards[to].length-len);
        if (t.isDrawn) {
            play.cards[from][play.cards[from].length-1].showtype = play.ShowType.back;
        }
        play.cards[from] = play.cards[from].concat(list);
    } else if (t.type=='deal') {
        var l = new Array(10);
        for (var i = 0; i < 10; i++) {
            l[i] = play.cards[i].splice(play.cards[i].length-1)[0];
        }
        play.decks.push(l);
    }
    play.drawMap();
}