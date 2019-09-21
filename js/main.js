//创建画布并放置图像
var img = new Image();
img.src = './img/flower.jpg';
var canvas = document.getElementById('cvs');
var ctx = canvas.getContext('2d');
var originPixel;
var pixel;
// var pixel;
img.onload = function () {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    pixel = ctx.getImageData(0, 0, canvas.width, canvas.height);    //操作图像数据
    originPixel = ctx.getImageData(0, 0, canvas.width, canvas.height); //存储原图像数据
    // pixel = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

//原图展示
function originImg() {
    console.log('原图展示');
    ctx.putImageData(originPixel, 0, 0);
}

//图像二值化
function imgBinarization() {
    console.log('图像二值化');
    pixel = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var r, g, b, alpha, average;
    var length = pixel.data.length;
    for (var i = 0; i < length; i += 4) {
        r = pixel.data[i];
        g = pixel.data[i + 1];
        b = pixel.data[i + 2];
        alpha = pixel.data[i + 3];
        average = (r + g + b) / 3;
        if (average < 128) {
            pixel.data[i] = 0
            pixel.data[i + 1] = 0
            pixel.data[i + 2] = 0
            pixel.data[i + 3] = alpha;
        } else {
            pixel.data[i] = 255
            pixel.data[i + 1] = 255
            pixel.data[i + 2] = 255
            pixel.data[i + 3] = alpha;
        }
    }
    ctx.putImageData(pixel, 0, 0);
}


//图像灰度化
function imgGrayScale() {
    console.log('图像灰度化');
    var pixel = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var length = pixel.data.length;
    var r, g, b, alpha, average;
    for (var i = 0; i < length; i += 4) {
        r = pixel.data[i];
        g = pixel.data[i + 1];
        b = pixel.data[i + 2];
        alpha = pixel.data[i + 3];
        var gray = calGrayVal(r, g, b);
        pixel.data[i] = gray
        pixel.data[i + 1] = gray
        pixel.data[i + 2] = gray;
        pixel.data[i + 3] = alpha;
    }
    ctx.putImageData(pixel, 0, 0);
}

//计算图像灰度值函数 公式为：Gray = R*0.299 + G*0.587 + B*0.114；
function calGrayVal(rValue, gValue, bValue) {
    return parseInt(rValue * 0.299 + gValue * 0.587 + bValue * 0.114);
}

//一维OTSU图像处理算法
function OTSUAlgorithm() {
    console.log('OTSU二值化处理');
    var m_pFstdHistogram = new Array(); //表示灰度值的分布点概率
    var m_pFGrayAccu = new Array(); //其中每一个值等于m_pFstdHistogram中从0到当前下标值的和
    var m_pFGrayAve = new Array(); //其中每一值等于m_pFstdHistogram中从0到当前指定下标值*对应的下标之和
    var m_pAverage = 0; //值为m_pFstdHistogram【256】中每一点的分布概率*当前下标之和
    var m_pHistogram = new Array(); //灰度直方图
    var i, j;
    var temp = 0,
        fMax = 0; //定义一个临时变量和一个最大类间方差的值
    var nThresh = 0; //最优阀值
    //获取灰度图像的信息
    // var imageInfo = GetGrayImageInfo();
    pixel = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var imageInfo = [pixel, ctx];
    // console.log(imageInfo);
    if (imageInfo == null) {
        window.alert("图像还没有转化为灰度图像！");
        return;
    }
    //初始化各项参数
    for (i = 0; i < 256; i++) {
        m_pFstdHistogram[i] = 0;
        m_pFGrayAccu[i] = 0;
        m_pFGrayAve[i] = 0;
        m_pHistogram[i] = 0;
    }
    //获取图像信息
    var canvasData = imageInfo[0];
    //获取图像的像素
    var pixels = canvasData.data;
    //下面统计图像的灰度分布信息
    for (i = 0; i < pixels.length; i += 4) {
        //获取r的像素值，因为灰度图像，r=g=b，所以取第一个即可
        var r = pixels[i];
        m_pHistogram[r]++;
    }
    console.log(m_pHistogram[56], pixels[0]);
    //下面计算每一个灰度点在图像中出现的概率
    var size = canvasData.width * canvasData.height;
    for (i = 0; i < 256; i++) {
        m_pFstdHistogram[i] = m_pHistogram[i] / size;
    }
    //下面开始计算m_pFGrayAccu和m_pFGrayAve和m_pAverage的值
    for (i = 0; i < 256; i++) {
        for (j = 0; j <= i; j++) {
            //计算m_pFGaryAccu[256]
            m_pFGrayAccu[i] += m_pFstdHistogram[j];
            //计算m_pFGrayAve[256]
            m_pFGrayAve[i] += j * m_pFstdHistogram[j];
        }
        //计算平均值
        m_pAverage += i * m_pFstdHistogram[i];
    }
    //下面开始就算OSTU的值，从0-255个值中分别计算ostu并寻找出最大值作为分割阀值
    for (i = 0; i < 256; i++) {
        temp = (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i]) *
            (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i]) /
            (m_pFGrayAccu[i] * (1 - m_pFGrayAccu[i]));
        if (temp > fMax) {
            fMax = temp;
            nThresh = i;
        }
    }
    //下面执行二值化过程 
    for (i = 0; i < canvasData.width; i++) {
        for (j = 0; j < canvasData.height; j++) {
            //取得每一点的位置
            var ids = (i + j * canvasData.width) * 4;
            //取得像素的R分量的值
            var r = canvasData.data[ids];
            //与阀值进行比较，如果小于阀值，那么将改点置为0，否则置为255
            var gray = r > nThresh ? 255 : 0;
            canvasData.data[ids + 0] = gray;
            canvasData.data[ids + 1] = gray;
            canvasData.data[ids + 2] = gray;
        }
    }
    //显示二值化图像
    // var newImage = document.getElementById('cvs').getContext('2d');
    ctx.putImageData(canvasData, 0, 0);
}


var opixel;
//图像边缘绘制
function imgEdge() {
    // imgBinarization();
    console.log('二值化后图像边缘绘制');
    var canvas_w = canvas.width;
    var canvas_h = canvas.height;
    // var pixel = ctx.getImageData(0, 0, canvas_w, canvas_h);
    //样本分离 上色后会影响后面对图像边缘判断
    opixel = ctx.getImageData(0, 0, canvas_w, canvas_h);
    // var length = pixel.data.length;
    var index; //像素点 R分量的索引值
    var redVal; //因为二值化后像素点各分量一样仅比较其中一个分量即可；
    var prevRedVal, nextRedVal, topRedVal, bottomRedVal; //  像素点个方向的像素值分量
    // 考虑到画布边缘像素只有2个方向的像素值分量；
    //需要嵌套循环来遍历每个像素点来特殊处理它们
    for (var i = 0; i < canvas_h; i++) {
        for (var j = 0; j < canvas_w; j++) {
            index = (canvas_w * i + j) * 4;
            redVal = pixel.data[index];

            // if (i == 0) {    
            //     topRedVal = redVal;  //图像上边
            // } else {
            //     topRedVal = pixel.data[index - canvas_w * 4]
            // }
            // if (i == canvas_h - 1) {     
            //     bottomRedVal = redVal;   //图像下边
            // }else{
            //     bottomRedVal = pixel.data[index + canvas_w*4]
            // }
            // if (j == 0) {    
            //     prevRedVal = redVal;     //图像左边
            // }else{
            //     prevRedVal = pixel.data[index - 4]
            // }
            // if (j == canvas_w - 1) {     
            //     nextRedVal = redVal;     //图像右边
            // }else{
            //     nextRedVal = pixel.data[index + 4];
            // }

            topRedVal = i==0? redVal:pixel.data[index - canvas_w * 4];
            bottomRedVal = i==canvas_h-1? redVal:pixel.data[index + canvas_w*4];
            prevRedVal = j==0? redVal:pixel.data[index - 4];
            nextRedVal = j==canvas_w-1? redVal:pixel.data[index + 4];
            
            if(redVal!=nextRedVal||redVal!=topRedVal||redVal!=prevRedVal||redVal!=bottomRedVal){
                //设定边缘颜色rgb分量
                var edgeColor =[137,71,243];
                opixel.data[index] = edgeColor[0];
                opixel.data[index + 1] = edgeColor[1];
                opixel.data[index + 2] = edgeColor[2];
            }

        }
    }
    ctx.putImageData(opixel, 0, 0);
}

// function edge(){
//     ctx.putImageData(opixel, 0, 0);
// }

//一键处理
function goDiscernEdge() {
    imgGrayScale();     //灰度值处理
    OTSUAlgorithm();    //二值化处理
    originImg();        //原图显示
    imgEdge();          //边缘绘制
    console.log('完成绘制');
}

var imgs = ['flower.jpg', 'flower2.jpg', 'flower3.jpg', 'flower4.jpg'].map((item) => `../img/${item}`);
var changeImg = function (){
    var imgIndex = 1;
    return function(){
        imgIndex = imgIndex === imgs.length? 0:imgIndex;
        img.src = imgs[imgIndex];
        // console.log(imgs[imgIndex]);
        imgIndex++;
    }
}();