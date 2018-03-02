var draw = {}
width = 0;
height = 0;
draw.init = function() {
        
    draw.cardWidth = 70;
    draw.cardHeight = 95;
    draw.minWidth = 720;
    draw.topHeight = 10;
    draw.cards = Array(105);
        
    //加载所有牌img
    for (var i = 0; i <= 104; i++) {
        draw.cards[i] = draw.loadImg(i);
    }
}

draw.reScale = function() {
    if (height == window.innerHeight && width == window.innerWidth)
        return;
    height = window.innerHeight;
    width = window.innerWidth;
    canvas.width = width*factor;
    canvas.height = height*factor;
    $canvas.css('width', width);
    $canvas.css('height', height);
    draw.intervalWidth = (width-draw.cardWidth*10)/11;
    play.drawMap();
}
draw.fullScreen = function() {
    var elem=$('#fullscreen')[0];  
    if(elem.webkitRequestFullScreen){  
        elem.webkitRequestFullScreen();     
    }else if(elem.mozRequestFullScreen){  
        elem.mozRequestFullScreen();  
    }else if(elem.requestFullScreen){  
        elem.requestFullscreen();  
    }else{  
        //浏览器不支持全屏API或已被禁用  
    }
    draw.reScale();
    setTimeout(draw.reScale, 100);
}  
draw.exitFullscreen=function(){  
    var elem=$('#fullscreen')[0];  
    if(elem.webkitCancelFullScreen){  
        elem.webkitCancelFullScreen();      
    }else if(elem.mozCancelFullScreen){  
        elem.mozCancelFullScreen();  
    }else if(elem.cancelFullScreen){  
        elem.cancelFullScreen();  
    }else if(elem.exitFullscreen){  
        elem.exitFullscreen();  
    }else{  
        //浏览器不支持全屏API或已被禁用  
    }  
}

draw.loadImg = function(i) {
    var img = document.createElement('img');
    img.src = 'img/cards/' + i + '.jpg';
    img.width = draw.cardWidth;
    img.height = draw.cardHeight;
    return img;
}
//扩大以提高清晰度
draw.drawImg = function(img, x, y, width, height) {
    context2D.drawImage(img, factor*x, factor*y, factor*width, factor*height);
}
draw.clearRect = function(x, y, width, height) {
    context2D.clearRect(factor*x, factor*y, factor*width, factor*height);
}
draw.drawStoke = function(x, y, w, h) {
    context2D.lineWidth = 2;
    context2D.strokeStyle = '#ffeb3b';
    context2D.strokeRect(factor*x+3, factor*y+3, factor*w-6, factor*h-6);
}
draw.drawCheat = function (list, count) {
    if (!list || !list.length || !count) {
        return;
    }
    strokest = context2D.strokeStyle;
    lineWi = context2D.lineWidth;
    
    context2D.strokeStyle = '#f51e1a';
    context2D.lineWidth = 7;
    
    context2D.strokeRect(factor*list[0].x, factor*list[0].y, factor*(draw.cardWidth), factor*(list[count].y-list[0].y));
    
    context2D.lineWidth = lineWi;
    context2D.strokeStyle = strokest;
}
draw.drawRect = function(list) {
    if (!list || !list.length) {
        return;
    }
    strokest = context2D.strokeStyle;
    lineWi = context2D.lineWidth;
    
    context2D.strokeStyle = '#f51e1a';
    context2D.lineWidth = 13;
    
    context2D.strokeRect(factor*list[0].x, factor*list[0].y, factor*(draw.cardWidth), factor*(list[list.length-1].y+draw.cardHeight-list[0].y));
    
    context2D.lineWidth = lineWi;
    context2D.strokeStyle = strokest;
}

draw.drawCard = function(color, point, x, y) {
    draw.drawImg(draw.cards[color*13+point], x, y, draw.cardWidth, draw.cardHeight)
}

draw.drawBack = function(x, y) {
    draw.drawImg(draw.cards[0], x, y, draw.cardWidth, draw.cardHeight);
}
draw.drawHint = function(cards, step) {
    var fromList = cards[step.from].slice(cards[step.from].length-step.count);
    draw.drawRect(fromList);
    setTimeout(draw.drawHint2, 500, cards, step);
    setTimeout(play.drawMap, 1000);
}

draw.drawHint2 = function(cards, step) {
    var toList = cards[step.to].slice(cards[step.to].length-1);
    if (toList.length == 0) {
        toList.push(draw.getPos(step.to, 0));
    }
    draw.drawRect(toList);
}
draw.getPos = function(row, line) {
    return {x:(row+1)*draw.intervalWidth+(row*draw.cardWidth), y:draw.topHeight};
}
draw.drawList = function(listIndex, list, length) {
    if (listIndex == -1) {
        draw.drawDecks(list);
    }
    var x = (listIndex+1)*draw.intervalWidth + listIndex*draw.cardWidth;
    draw.clearRect(x, 0, draw.cardWidth+1, height-draw.topHeight-draw.cardHeight);
    y = draw.topHeight;
    if (!length) {
        length = list.length;
    }
    draw.drawBaseList(list, x, y, length, true);
}
draw.drawBaseList = function(list, x, y, length, isRecord) {
    if (!length) {
        length = list.length;
    }
    var backinte = 8;
    var upinte = 28;
    var bcount = 0;
    var ucount = 0;
    for (var i = 0; i < length; i++) {
        var card = list[i];
        if (card.showtype == play.ShowType.display) {
            ucount++;
        } else if (card.showtype == play.ShowType.back) {
            bcount++;
        }
    }
    while (bcount*backinte + ucount*upinte > height-draw.cardHeight) {
        backinte--; upinte-=3;
    }
    draw.drawStoke(x, y, draw.cardWidth, draw.cardHeight);
    for (var i = 0; i < length; i++) {
        var card = list[i];
        if (isRecord) {
            card.x = x; card.y = y;
        }
        if (card.showtype == play.ShowType.display) {
            draw.drawCard(card.color-1, card.point, x, y);
            y += upinte;
        } else if (card.showtype == play.ShowType.back) {
            draw.drawBack(x, y);
            y += backinte;
        }
    }
}

draw.drawDecks = function(decks) {
    var y = height-10-draw.cardHeight;
    var x = width-draw.cardWidth-draw.intervalWidth;
    for (var i = 0; i < decks.length; i++) {
        draw.drawBack(x, y);
        if (i == decks.length-1) {
            decks[i].x = x;
            decks[i].y = y;
        }
        x -= 15;
    }
}

draw.getListIndex = function(x, y) {
    var deck = play.decks[play.decks.length-1];
    var cards = play.cards;
    var ans = {listIndex:'blank'};
    for (var i = 0; i < cards.length; i++) {
        if (x >= i*draw.cardWidth+(i+1)*draw.intervalWidth && x <= (i+1)*(draw.cardWidth+draw.intervalWidth)) {
            list = cards[i];
            for (var j = list.length-1; j >= 0; j--) {
                if (y >= list[j].y && y <= list[j].y+draw.cardHeight) {
                    ans.listIndex = i;
                    ans.cardIndex = j;
                    break;
                }
            }
            if (!ans.cardIndex && y >= 8 && y <= draw.cardHeight+8) {
                ans.listIndex = i;
                ans.cardIndex = 0;
            }
            break;
        }
    }
    if (ans.listIndex == 'blank' && !!deck && x >= deck.x && y >= deck.y && x <= deck.x+draw.cardWidth && y <= deck.y+draw.cardHeight) {
        ans.listIndex = -1;
    }
    return ans;
}

draw.drawMap = function(cards, decks) {
    if (cards==undefined) {
        return;
    }
    draw.clearRect(0,0,width,height);
    if (decks != undefined) {
        draw.drawDecks(decks);
    }
    for (var i = 0; i < 10; i++) {
        //cards[i][cards[i].length-1].showtype = true;
        draw.drawList(i, cards[i]);
    }
}

draw.redraw = function(cards, decks, movingList, offx, offy) {
    draw.clearRect(0,0,width,height);
    draw.drawMap(cards, decks);
    draw.drawBaseList(movingList, movingList[0].x+offx, movingList[0].y+offy);
}


test = function(i){a = AI.getMoveSteps(play.cards); if (i == 0){for (var x = 0; x < a.length; x++)setTimeout(draw.drawHint, x*2000 , play.cards, a[x]);} else draw.drawHint(play.cards, a[!!i?i:0]);return a;}