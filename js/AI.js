var AI = {}
AI.class = {}
AI.class.Step = function(from, to, count) {
    this.from = from;
    this.to = to;
    this.count = count;
}
AI.class.Step.prototype = {}
AI.init = function(){
    cutCount = 0;
    searchCount = 0;
    repeatCount = 0;
}

AI.playStep = function() {
    
}

AI.hint = function() {}

AI.playWhole = function(cards) {
    
}

AI.copyCards = function(cards) {
    cp = Array(cards.length);
    for (var i = 0; i < cards.length; i++) {
        cp[i] = AI.copyList(cards[i]);
    }
    return cp;
}
AI.copyList = function (list) {
    return play.copyList(list);
}
AI.move = function(cards, step) {
    var from = step.from;
    var to = step.to;
    var count = step.count;
    var len = cards[from].length;
    var list = cards[from].splice(len-count);
    cards[to] = cards[to].concat(list);
    for (var i = 0; i < list.length; i++) {
        list[i].showtype = play.ShowType.display;
    }
    len = cards[from].length;
    if (len>0 && cards[from][len-1].showtype == play.ShowType.back) {
        cards[from][len-1].showtype = play.ShowType.display;
    }
    if (list[list.length-1].point == 1 && play.checkDone(cards[to])) {
        play.doneCards(cards[to]);
        return true;
    }
    return false;
}

AI.drawStr = function(str) {
    draw.drawMap(AI.readCards(str));
}
AI.drawCards = function(cards) {
    draw.drawMap(cards);
}

AI.deal = function(cards, decks) {
    if (decks.length==0) {
        return false;
    }
    var deck = decks.pop();
    for (var i = 0; i < cards.length; i++) {
        deck[i].showtype = play.ShowType.display;
        cards[i].push(deck[i]);
    }
    return cards;
}
AI.AIHint = function(cards) {
    AI.permutationTable = new AI.class.HashTable(0xffff);
    var node = AI.createNode(cards);
    node = AI.deepSearch(node);
    var steps = [];
    while (true){
        var step = node.step;
        node = node.parent;
        if (!node) {
            break;
        }
        step.cards = node.cards;
        steps.unshift(step);
    }
    return steps;
}
AI.searchBest = function(cards, decks) {
    var list = [];
    cards = AI.copyCards(cards);
    decks = AI.copyCards(decks);
    var node = AI.createNode(cards);
    var nodeList = Array();
    while (true) {
        cutCount = 0;
        searchCount = 0;
        repeatCount = 0;
        node = AI.deepSearch(node);
        if (node == nodeList[nodeList.length-1]) {
            cards = AI.deal(node.cards, decks);
            if (!cards) {
                return node;
            }
            node = AI.createNode(cards, node, "deal");
        }
        nodeList.push(node);
        AI.permutationTable = new AI.class.HashTable(0xffff);
        AI.drawCards(node.cards);
        console.log("cut"+cutCount);
        console.log("search"+searchCount);
        console.log("repeat"+repeatCount);
        if (node.bestValue <= 0) {
            return node.bestLeaf;
        }
        if (window.cmd == 'exit') {
            return;
        }
    }
}

//深搜
AI.deepSearch = function(node, depth, deepest) {
    if (!depth) {
        depth = 0;
    }
    if (!deepest) {
        deepest = 7;
    }
    if (depth >= deepest) {
        node.bestLeaf = node;
        return node;
    }
    searchCount ++;
    //表明已经搜索过
    var currentNode = AI.permutationTable.get(node);
    if (!!currentNode) {
        //console.log('repeated')
        repeatCount++;
        //如果深度更小，更改搜索到的节点的父节点
        var depth_1 = AI.getDepth(currentNode);
        var depth_2 = AI.getDepth(node);
        if (depth_1 > depth_2) {
            currentNode.parent = node.parent;
            currentNode.step = node.step;
        } else if (depth_1 <= depth_2) {
            node.parent = currentNode.parent;
            node.step = currentNode.step;
            if (currentNode.bestLeaf) {
                return currentNode.bestLeaf;
            } else {
                return currentNode;
            }
        }
    }
    currentNode = node;
    currentNode.son = Array();
    AI.permutationTable.put(currentNode);
    var steps = AI.stepsFilter(AI.getMoveSteps(currentNode.cards));
    var cards = currentNode.cards;
    var bestValue = currentNode.value;
    var bestLeaf = currentNode;
    for (var i = 0; i < steps.length; i++) {
        var cd = AI.copyCards(cards);
        var step = steps[i];
        var isDoneCards = AI.move(cd, step);
        var subNode = AI.createNode(cd, currentNode, step);
        
        //优先消除一组
        if (isDoneCards) {
            subNode.value -= 500;
            return subNode;
        }
        //剪枝
        
        if (subNode.value - currentNode.value > 0 && subNode.cards[subNode.step.to].length != subNode.step.count) {
            cutCount++;
            continue;
        }
        
        
        //currentNode.son.push(subNode);
        var leafNode = AI.deepSearch(subNode, depth+1);
        if (!leafNode) {
            debugger;
        }
        if (leafNode.value < bestValue) {
            bestValue = leafNode.value;
            bestLeaf = leafNode;
            if (bestValue <= -900) {
                return leafNode;
            }
        }
    }
    currentNode.bestLeaf = bestLeaf;
    return bestLeaf;
}

AI.getDepth = function(node) {
    var d = 0;
    while (true) {
        if (!node.parent) {
            break;
        }
        d++;
        node = node.parent;
    }
    return d;
}

//树结构 包含属性parent, step 
AI.createNode = function(cards, parent, step, depth) {
    var inf = {};
    inf.cards = cards;
    inf.hash = AI.hash(cards);
    inf.value = AI.evaluate(cards);
    inf.step = step;
    inf.parent = parent;
    inf.depth = depth;
    return inf;
}

//广搜
AI.searchBest2 = function(cards) {
    var list = [];
    cards = AI.copyCards(cards);
    list.push({str: AI.writeCards(cards),cards:cards, depth:0, parent:undefined});
    var minValue = 999999;
    while (list.length > 0) {
        var cdobj = list.shift();
        var cds = cdobj.cards;
        var str = AI.writeCards(cds);
        cdobj.str = str;
        var value = AI.permutationTable.get(str);
        if (value) {
            continue;
        }
        console.log(list.length);
        if (list.length > 50000) {
            return;
        }
        value = AI.evaluate(cds);
        cdobj.value = value;
        AI.permutationTable.put(cdobj);
        if (value < minValue) {
            minValue = value;
        } else if (value > minValue) {
        //    continue;
        }
        if (cdobj.value - cdobj.parent.value == 0) {
            console.log('=0:'+list.length);
            continue;
        }
        var steps = AI.stepsFilter(AI.getMoveSteps(cds));
        for (var i = 0; i < steps.length; i++) {
            var cd = AI.copyCards(cds);
            var step = steps[i];
            AI.move(cd, step);
            var node = AI.createNode(cd, cdobj, step, depth+1)
            list.push(node);
        }
    }
}

AI.getBestStep = function() {
    var min = 99999;
    var minobj;
    var t = AI.permutationTable.table;
    for (var i = 0; i < t.length; i++) {
        if (!!t[i]) {
            for (var j = 0; j < t[i].length; j++) {
                if (min > t[i][j].value) {
                    min = t[i][j].value;
                    minobj = t[i][j];
                }
            }
        }
    }
    return minobj;
}

//置换表及hashtable类

AI.hash = function(cards) {
    var hash = 1;
    //var str = '';
    for (var i = 0; i < cards.length; i++) {
        for (var j = 0; j < cards[i].length; j++) {
            //str += cards[i][j].point;
            hash = ((hash<<5)-hash)+cards[i][j].point*7;
            hash = hash & hash;
        }
    }
    //return window.hash(str);
    return hash;
}
AI.class.HashTable = function(hashCount) {
    if (!hashCount) {
        hashCount = 0xffff;
    }
    this.hashCount = hashCount;
    this.table = Array(hashCount);
}
AI.class.HashTable.prototype = {}
AI.class.HashTable.prototype.put = function(obj) {
    var hashc = obj.hash&this.hashCount;
    if (!this.table[hashc]) {
        this.table[hashc] = Array();
    }
    var t = this.table[hashc];
    this.table[hashc].push(obj);
    return true;
}
AI.compareCards = function(cards1, cards2) {
    if (!cards1 || !cards2) {
        return false;
    }
    var isSame = true;
    for (var i = 0; i < cards1.length; i++) {
        if (cards1[i].length != cards2[i].length) {
            isSame = false;
            break;
        }
        for (var j = 0; j < cards1[i].length; j++) {
            if (cards1[i][j].point != cards2[i][j].point || cards1[i][j].color != cards2[i][j].color) {
                isSame = false;
                break;
            }
        }
        if (!isSame) {
            break;
        }
    }
    return isSame;
}

AI.class.HashTable.prototype.get = function(obj) {
    var hashc = obj.hash&this.hashCount;
    if (!this.table[hashc]) {
        return undefined;
    } else {
        var t = this.table[hashc];
        for (var i = 0; i < t.length; i++) {
            if (t[i].value == obj.value && AI.compareCards(t[i].cards, obj.cards)) {
                return t[i];
            }
        }
        return undefined;
    }
}
AI.permutationTable = new AI.class.HashTable(0x3ffff);

//估值函数
AI.value = {};
AI.evaluate = function(cards) {
    if (typeof cards == 'String') {
        cards = AI.readCards(cards);
    }
    var emptySlot = 0;
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].length==0) {
            emptySlot++;
        }
    }
    if (emptySlot == 10) {
        return -99999;
    }
    if (emptySlot > 4) {
        slotValue = -10;
    } else if (emptySlot == 4) {
        slotValue = -20;
    } else if (emptySlot == 3) {
        slotValue = -30;
    } else if (emptySlot == 2) {
        slotValue = -40;
    } else if (emptySlot == 1) {
        slotValue = -50;
    } else slotValue = 0;
    var value = 0;
    for (var i = 0; i < cards.length; i++) {
        var backCount = 0;
        var cl = cards[i];
        if (cl.length==0) {
            value += slotValue;
            continue;
        }
        var lastColor = 0;
        var lastPoint = 0;
        var linePo = 35;
        for (var j = cl.length-1; j >= 0; j--) {
            cd = cl[j];
            if (cd.showtype != play.ShowType.display) {
                linePo = 60;
                backCount++;
            }
            else if (cd.point == lastPoint + 1) {
                if (cd.color == lastColor) {
                    linePo -= 2.5;
                } else {
                    linePo = 35;
                }
            } else {
                linePo = 35;
            }
            value += linePo;
            lastColor = cd.color;
            lastPoint = cd.point;
        }
        //value += backCount*cards[i].length*0.1;
    }
    return value;
}


//局面保存函数
AI.transArray = '0,1,2,3,4,5,6,7,8,9,s,j,q,k'.split(',');
//#表示列分隔符  字符串组成为 牌花色+牌点数+牌翻面情况+# 如 4422923s2252262451#3623123721124721q1#432132252172182381#4321323524124922s1#4121421s2492281#3922q21923q2331#4j21621522j2211#3523624221q2321#3k2382172392231#4821824723s2221#
AI.writeCards = function (cards) {
    var str = '';
    for (var i = 0; i < cards.length; i++) {
        for (var j = 0; j < cards[i].length; j++) {
            str += cards[i][j].color+AI.transArray[cards[i][j].point]+cards[i][j].showtype;
        }
        str += '#';
    }
    return str;
}
AI.readCards = function(str) {
    var cards = Array(10);
    var p = 0;
    for (var i = 0; i < cards.length; i++) {
        cards[i] = Array();
        while (true) {
            var c = str.charAt(p);
            if (p+1 >= str.length || c == '#') {
                p++;
                break;
            }
            var color = str.charAt(p++);
            var point = str.charAt(p++);
            var showtype = str.charAt(p++);
            for (k = 0; k < AI.transArray.length; k++) {
                if (point == AI.transArray[k]) {
                    point = k;
                    break;
                }
            }
            cards[i].push(new play.class.Card(color, point, showtype));
        }
    }
    return cards;
}


AI.stepsFilter = function(steps) {
    var map = Array(10);
    for (var i = 0; i < 10; i++) {
        map[i] = Array(10);
    }
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (!!map[step.from][step.to]) {
            if (map[step.from][step.to].count < step.count) {
                map[step.from][step.to] = step;
            }
        } else {
            map[step.from][step.to] = step;
        }
    }
    steps.splice(0);
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            if (!!map[i][j]) {
                steps.push(map[i][j]);
            }
        }
    }
    return steps;
}
AI.getMoveSteps = function(cards, singleStep) {
    if (!cards) {
        return Array();
    }
    var fromList = Array();
    var toList = Array();
    var emptySlot = 0;
    var emptyMoved = false;
    for (var i = 0; i < cards.length; i++) {
        var pushFromList = Array();
        var l = cards[i];
        if (l.length == 0) {
            emptySlot++;
            toList[i] = play.emptyCard;
            pushFromList = Array();
        } else {
            //每列非空列
            toList[i] = l[l.length-1];
            var lastPoint = 0;
            for (var j = l.length-1; j >= 0; j--) {
                if (!pushFromList || !pushFromList.length) {
                    //插入第一个可移动牌
                    pushFromList = Array();
                    pushFromList.push(l[j]);
                    lastPoint = l[j].point;
                } else {
                    if (l[j].showtype == play.ShowType.display && lastPoint+1 == l[j].point) {
                        pushFromList.push(l[j]);
                        lastPoint++;
                    } else {
                        break;
                    }
                }
            }
        }
        fromList.push(pushFromList);
    }
    
    var steps = Array();
    //判断从fromList(二维数组)至toList(一维)可否移动
    for (var i = 0; i < toList.length; i++) {
        var emptyCount = emptySlot;
        var moveTop = toList[i].point-1;
        if (moveTop == 0) {
            continue;
        }
        if (moveTop == -1) {
            emptyCount --;
            if (emptyMoved) {
                continue;
            }
        }
        for (var j = 0; j < fromList.length; j++) {
            var l = fromList[j];
            if (i == j || l.length == 0 || (l[0].point > moveTop && moveTop != -1)) {
                continue;
            }
            var color = l[0].color;
            var colorChange = 0;
            for (var k = 0; k < l.length; k++) {
                //不同色快捷判断可否到达
                if (color != l[k].color) {
                    if (singleStep) {
                        break;
                    }
                    colorChange++;
                }
                color = l[k].color;
                if (colorChange > emptyCount) {
                    break;
                }
                
                if (moveTop == -1) {
                    //-1表示空缺位置
                    emptyMoved = true;
                    steps.push(new AI.class.Step(j, i, 1+k));
                } else if (l[k].point == moveTop) {
                    steps.push(new AI.class.Step(j, i, 1+k));
                    break;
                }
            }
        }
    }
    
    //过滤掉空移空的移步
    for (var i = 0; i < steps.length; i++) {
        if (cards[steps[i].to].length == 0 && cards[steps[i].from].length == steps[i].count) {
            steps.splice(i--, 1);
        }
    }
    return steps;
}

//hash哈希字符串函数
hash = function(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


AI.test = function() {
    searchCount = 0;
    cutCount = 0;
    AI.deepSearch(AI.createNode(play.cards), 0);
}

funcCount = 0;
timeRecord = {};
functionTimeRecorder = function(func, funcName, recordName) {
    var x = ++funcCount;
    if (!recordName) {
        recordName = 'timeRecord.recordTime' + funcCount +'Time';
    } else recordName = 'timeRecord'+recordName+'Time';
    timeRecord[recordName+'func'] = func;
    timeRecord[recordName] = 0;
    eval(funcName+'=function(){var beg = new Date().getTime();var ans = timeRecord["' + recordName + 'func"].apply(this, arguments);timeRecord.' + recordName + '+=new Date().getTime()-beg; return ans;}');
}
for (var x in AI) {
    if (typeof AI[x] == 'function') {
        functionTimeRecorder(AI[x], 'AI.'+x, x);
    }
}

/*functionTimeRecorder(AI.evaluate, 'AI.evaluate', 'evaluate');
functionTimeRecorder(AI.copyCards, 'AI.copyCards', 'copyCards');
functionTimeRecorder(AI.createNode, 'AI.createNode', 'createNode');
functionTimeRecorder(AI.getMoveSteps, 'AI.getMoveSteps', 'getMoveSteps');
functionTimeRecorder(AI.searchBest, 'AI.searchBest', 'searchBest');
*/function showRecordTime() {
    for (var x in timeRecord) {
        console.log(x + ':' + timeRecord[x]);
    }
}
