
import { spawn, spawnSync } from 'child_process';
import prompts from 'prompts';
import ora,{ oraPromise } from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import ProgressBar from 'progress';

const ffterm = {};

ffterm.Table = Table;

ffterm.getCurrentDir = function() {
    return process.cwd();
}

ffterm.run = function(command, options) {
    const spawnOptions = options ?? {};
    if (spawnOptions.verbose != false) spawnOptions.inherit = true;

    return new Promise((resolve, reject) => {
        const child = spawn(command.split(' ')[0], command.split(' ').slice(1), spawnOptions);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
        if (code === 0) {
            resolve(stdout);
        } else {
            if (spawnOptions.throwError) {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            } else {
                console.error(stderr);
                resolve(stdout);
            }
        }
        });

        child.on('error', (error) => {
            reject(new Error(`Failed to start command: ${error}`));
        });
    });
}

ffterm.prompt = prompts.prompt;

ffterm.log = function( msg, isSuccess = true) {
    console.log((isSuccess ? chalk.green('√ ') : chalk.red('× '))+msg);
}

/**
 * Yes/No 질문을 묻고 대답을 받는다.
 *
 * @param {string} msg
 * @param {boolean} defaultIsYes
 * @return {Promise<boolean>} 
 */
ffterm.confirm = function(msg,defaultIsYes = false) {
    return new Promise(async (resolve, reject) => {
        let result = await prompts.prompt({
            type: 'confirm',
            name: 'confirm',
            message: msg,
            initial: defaultIsYes ?? true
        });
        resolve(result.confirm);
    });
}

ffterm.spinner = ora;
ffterm.spinnerPromise = oraPromise;
ffterm.color = chalk;
ffterm.box = boxen;


  
/**
 * 배너를 출력한다.
 *
 * @param {*} title
 * @param {*} options
 */
ffterm.banner = function(title, options) {
    options = Object.assign({
        padding: {left:2,right:2,top:0,bottom:0},
        // borderStyle: 'round',
        borderColor: 'green',
    },options);
    console.log(ffterm.box(title, options));
}

ffterm.getWidth = function() {
    return process.stdout.columns;
}

ffterm.getHeight = function() {
    return process.stdout.rows;
}



/**
 * 가로줄을 삽입한다.
 *
 * @param {*} lineChar
 */
ffterm.line = function(lineChar) {
    lineChar ??= '─';
    console.log(lineChar.repeat(ffterm.getWidth()/lineChar.length));
}

/**
 * 테이블 스트링 만들기
 * ex) [[{content:'a',rowSpan:2,hAlign:'center'},'b','c']]
 * 첫줄은 해더로 다른 색으로 표시된다.
 * https://github.com/cli-table/cli-table3/blob/master/advanced-usage.md
 * 폭 정하기
 * ex) options = colWidths: [10, 10, 10]
 * data 항목은 object로 해서 옵션을 줄 수 있음
 *
 * @param {*} data
 * @param {object} [options]
 * @return {string} 
 */
ffterm.table = function(data, options) {

    const table = new ffterm.Table( Object.assign((options ?? {}), {
        head:data[0]
    }));
    table.push(...data.slice(1));
    return table.toString();
}

/**
 * 
 * 프로그래스바 생성하기
 * ex)
 * const bar = ffterm.progressBar({message:'Downloading',total:100});
 * bar.tick(10);
 * @param {*} options
 * @return {ProgressBar} 
 * 
 */
ffterm.progressBar = function (options) {
    options ??= { message:''};
    let format = `${options.message} :bar :percent :etas`;
    let barOptions = {
        complete: '\u001b[42m \u001b[0m',
        incomplete: '\u001b[41m \u001b[0m',
        width: 40,
        total: options.total ?? 100
    };
    return new ProgressBar(format, barOptions);
}


export default ffterm;

