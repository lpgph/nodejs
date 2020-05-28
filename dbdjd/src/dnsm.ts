import * as puppeteer from 'puppeteer'
import mongo from './lib/mongoDb'
import chalk from 'chalk'

const log = console.log

// 定义要爬去的数据结构
interface IWriteData {
  link: string
  picture: string
  price: number | string
  title: string
  date: string
}

// const nowDate = parseTime(new Date())
//  log(chalk.yellow('当前时间：'+ nowDate))


main()

// 进入代码的主逻辑
async function main() {
  // 首先通过Puppeteer启动一个浏览器环境
  const browser = await puppeteer.launch()
  //  const browser = await puppeteer.launch({
  //   headless: false, //默认为true（无头），不显示浏览器界面
  //   slowMo :200, //减速显示，有时会作为模拟人操作特意减速
  //   devtools: true //显示开发者工具。页面宽高默认800*600,把开发者工具显示再隐藏页面会占满屏幕，有没有大佬解释下？
  // })

  log(chalk.green('服务正常启动'))
  // 使用 try catch 捕获异步中的错误进行统一的错误处理
  try {
    // 打开一个新的页面
    const page = await browser.newPage()
    // await page.setViewport({
    //   width: 1580,
    //   height: 980
    // });
    // 监听页面内部的console消息
    page.on('console', msg => {
      if (typeof msg === 'object') {
        console.dir(msg)
      } else {
        log(chalk.blue(msg))
      }
    })
    await page.goto('https://paipai.jd.com/auction-list/{"pageNo":1,"pageSize":50,"category1":"","status":"","orderDirection":1,"orderType":1,"groupId":1000005}?entryid=')
    log(chalk.yellow('页面初次加载完毕'))


    // 解析页面数据格式
    const handleDate = async () => {
      var maxLength = await page.evaluate(() => {
        //清除分页数据
        let pageNextInput: HTMLInputElement = document.querySelector(".el-input__inner[type='number']")
        pageNextInput.value = ""
        return ~~pageNextInput.max
      })


      const list = await page.evaluate(() => {
        const writeDataList: IWriteData[] = []
        let itemList = document.querySelectorAll('.gl-item.later')
        for (let item of itemList) {
          //  console.log("加载节点  " + item)
          let writeData: IWriteData = {
            picture: undefined,
            link: undefined,
            title: undefined,
            price: undefined,
            date: undefined
          }

          let img: HTMLImageElement = item.querySelector('.p-img>a>img')
          writeData.picture = img.src
          log("加载图片   " + img.src)
          let link: HTMLAnchorElement = item.querySelector('.p-btn>a')
          writeData.link = link.href
          log("加载链接   " + link.href)
          let price: HTMLTextAreaElement = item.querySelector('.p-price .origin-price')
          // 找到商品的价格，默认是string类型 通过~~转换为整数number类型
          writeData.price = price.innerText
          log("加载价格   " + price.innerText)
          let title: HTMLAnchorElement = item.querySelector('.p-name>a')
          writeData.title = title.innerText
          log("加载名称   " + title.innerText)
          writeData.date = new Date().toUTCString()
          writeDataList.push(writeData)
        }
        return writeDataList
      })
      if (list != null && list.length > 0) {
        const result = await mongo.insertMany('dnsm', list)
        log(chalk.yellow('写入数据库完毕'))
      }
      return maxLength
    }

    var pageNo = 1

    var maxPage = 0
    do {


      // 找到分页的输入框以及跳转按钮
      const pageInput = await page.$(`.el-input__inner[type='number']`)
      // //模拟点击
      // await submit.click()
      // 焦点设置到搜索输入
      await pageInput.focus();
      // 模拟输入的跳转页数
      await pageInput.type('' + pageNo, { delay: 100 })
      log(pageInput.toString())
      // 回车
      await pageInput.press('Enter');

      await page.waitFor(2000)

      log(chalk.yellow("当前第" + pageNo + "页"));
      log(page.url())
      // console.clear()
      // log(chalk.yellow(formatProgress(i)))
      log(chalk.yellow('页面数据加载完毕'))
      // 截屏整个视图
      // await page.screenshot({ path: pageNo+'.png' });
      maxPage = await handleDate()
      log(chalk.yellow("总页数" + maxPage + "页"));
      pageNo += 1
      await page.waitFor(1000)
    } while (pageNo < maxPage);


  } catch (error) {
    console.log(error)
    log(chalk.red('服务意外终止'))
    await browser.close()
  } finally {
    process.exit(0)
  }
}